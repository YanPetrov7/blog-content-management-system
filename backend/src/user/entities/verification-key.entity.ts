import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('verification_keys')
export class VerificationKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;
}
