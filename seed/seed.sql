INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES
    ('johndoe', 'johndoe@example.com', 'hashedpassword1', 'John', 'Doe'),
    ('janedoe', 'janedoe@example.com', 'hashedpassword2', 'Jane', 'Doe'),
    ('alice', 'alice@example.com', 'hashedpassword3', 'Alice', 'Smith'),
    ('bob', 'bob@example.com', 'hashedpassword4', 'Bob', 'Brown');

INSERT INTO categories (name, description) VALUES
    ('Technology', 'All about the latest in tech'),
    ('Health', 'Health and wellness tips'),
    ('Travel', 'Travel guides and tips'),
    ('Food', 'Delicious recipes and food reviews');

INSERT INTO posts (title, content, author_id, category_id, is_published) VALUES
    ('The Future of AI', 'Artificial Intelligence is evolving rapidly...', 1, 1, TRUE),
    ('10 Tips for a Healthier Life', 'Here are ten tips to improve your health...', 2, 2, TRUE),
    ('Top 10 Travel Destinations for 2023', 'Looking for your next adventure? Here are the top spots...', 3, 3, TRUE),
    ('How to Make the Perfect Pizza', 'Making pizza at home is easier than you think...', 4, 4, TRUE),
    ('Understanding Quantum Computing', 'Quantum computing is a new paradigm...', 1, 1, TRUE),
    ('Meditation for Beginners', 'Meditation can help reduce stress...', 2, 2, TRUE),
    ('Exploring the Alps', 'The Alps are a great destination for adventure seekers...', 3, 3, FALSE),
    ('The Best Vegan Brownies', 'These vegan brownies are rich and fudgy...', 4, 4, FALSE);
