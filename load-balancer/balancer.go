package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"load-balancer/httptools"
	"load-balancer/signal"
	"log"
	"net/http"
	"sync"
	"time"
)

const (
	ColorReset  = "\033[0m"
	ColorRed    = "\033[31m"
	ColorGreen  = "\033[32m"
	ColorYellow = "\033[33m"
)

var (
	port         = flag.Int("port", 8090, "load balancer port")
	timeoutSec   = flag.Int("timeout-sec", 10, "request timeout time in seconds")
	https        = flag.Bool("https", false, "whether backends support HTTPs")
	traceEnabled = flag.Bool("trace", false, "whether to include tracing information into responses")
)

func scheme() string {
	if *https {
		return "https"
	}
	return "http"
}

// HttpClient interface for executing HTTP requests
type HttpClient interface {
	Do(req *http.Request) (*http.Response, error)
}

var client HttpClient = &http.Client{}

// LoadBalancer represents an instance of the load balancer
type LoadBalancer struct {
	serversPool    []string      // List of all backend servers
	healthyServers []string      // List of healthy servers
	currentIndex   int           // Current index for Round-Robin
	mutex          sync.Mutex    // Mutex to protect access to healthyServers and currentIndex
	timeout        time.Duration // Request timeout duration
}

// NewLoadBalancer creates a new instance of LoadBalancer
func NewLoadBalancer(servers []string, timeoutSec int) *LoadBalancer {
	return &LoadBalancer{
		serversPool: servers,
		timeout:     time.Duration(timeoutSec) * time.Second,
	}
}

// StartHealthChecks initiates periodic health checks for backend servers
func (lb *LoadBalancer) StartHealthChecks() {
	for _, server := range lb.serversPool {
		server := server
		// Initial health check
		lb.checkServerHealth(server)

		// Start periodic health checks
		go func() {
			ticker := time.NewTicker(10 * time.Second)
			defer ticker.Stop()
			for range ticker.C {
				lb.checkServerHealth(server)
			}
		}()
	}
}

// checkServerHealth checks the health of a server and updates the healthyServers list
func (lb *LoadBalancer) checkServerHealth(server string) {
	isHealthy := lb.health(server)

	if isHealthy {
		log.Printf("%s[OK]%s Health check passed for %s", ColorGreen, ColorReset, server)
	} else {
		log.Printf("%s[WARN]%s Health check failed for %s", ColorYellow, ColorReset, server)
	}

	lb.mutex.Lock()
	defer lb.mutex.Unlock()

	index := -1
	for i, s := range lb.healthyServers {
		if s == server {
			index = i
			break
		}
	}

	if isHealthy {
		if index == -1 {
			lb.healthyServers = append(lb.healthyServers, server)
		}
	} else {
		if index != -1 {
			lb.healthyServers = append(lb.healthyServers[:index], lb.healthyServers[index+1:]...)

			if lb.currentIndex >= index && lb.currentIndex > 0 {
				lb.currentIndex--
			}
		}
	}
	log.Printf("%s[INFO]%s Current healthy servers: %v", ColorYellow, ColorReset, lb.healthyServers)
}

// health performs a health check on a given server
func (lb *LoadBalancer) health(server string) bool {
	ctx, cancel := context.WithTimeout(context.Background(), lb.timeout)
	defer cancel()

	url := fmt.Sprintf("%s://%s/health", scheme(), server)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		log.Printf("%s[ERROR]%s Failed to create health check request: %v", ColorRed, ColorReset, err)
		return false
	}

	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		//log.Printf("%s[ERROR]%s Server %s is not healthy: %v", ColorRed, ColorReset, server, err)
		return false
	}
	defer resp.Body.Close()
	return true
}

// nextServer returns the next server using Round-Robin algorithm
func (lb *LoadBalancer) nextServer() (string, error) {
	lb.mutex.Lock()
	defer lb.mutex.Unlock()

	if len(lb.healthyServers) == 0 {
		return "", errors.New("no healthy servers available")
	}
	server := lb.healthyServers[lb.currentIndex]
	lb.currentIndex = (lb.currentIndex + 1) % len(lb.healthyServers)
	return server, nil
}

// forward proxies the request to the specified backend server
func (lb *LoadBalancer) forward(server string, rw http.ResponseWriter, req *http.Request) {
	ctx, cancel := context.WithTimeout(req.Context(), lb.timeout)
	defer cancel()

	// Clone and modify the request for forwarding
	fwdReq := req.Clone(ctx)
	fwdReq.URL.Host = server
	fwdReq.URL.Scheme = scheme()
	fwdReq.Host = server
	fwdReq.RequestURI = ""

	resp, err := client.Do(fwdReq)
	if err != nil {
		log.Printf("%s[ERROR]%s Failed to forward request to %s: %v", ColorRed, ColorReset, server, err)
		http.Error(rw, "Service Unavailable", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	// Copy response headers
	for k, vv := range resp.Header {
		for _, v := range vv {
			rw.Header().Add(k, v)
		}
	}

	if *traceEnabled {
		rw.Header().Set("lb-from", server)
	}

	rw.WriteHeader(resp.StatusCode)

	// Copy response body
	if _, err := io.Copy(rw, resp.Body); err != nil {
		log.Printf("%s[ERROR]%s Failed to copy response body: %v", ColorRed, ColorReset, err)
	}

	log.Printf("%s[OK]%s Successfully forwarded request \"%s %s\" to %s", ColorGreen, ColorReset, req.Method, req.URL.Path, server)
}

func main() {
	flag.Parse()

	servers := []string{
		"backend1:8080",
		"backend2:8080",
		"backend3:8080",
	}

	lb := NewLoadBalancer(servers, *timeoutSec)
	lb.StartHealthChecks()

	// Create HTTP server to accept incoming requests
	frontend := httptools.CreateServer(*port, http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
		server, err := lb.nextServer()
		if err != nil {
			log.Printf("%s[ERROR]%s No healthy servers available", ColorRed, ColorReset)
			http.Error(rw, "Service Unavailable", http.StatusServiceUnavailable)
			return
		}
		lb.forward(server, rw, req)
	}))

	log.Printf("%s[INFO]%s Load balancer started on port %d", ColorYellow, ColorReset, *port)
	log.Printf("%s[INFO]%s Trace enabled: %t", ColorYellow, ColorReset, *traceEnabled)
	frontend.Start()

	// Wait for termination signal
	signal.WaitForTerminationSignal()
}
