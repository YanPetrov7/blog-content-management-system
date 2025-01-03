import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  first_name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  last_name?: string;

  @Column({ type: 'bytea', nullable: true })
  avatar_small?: Buffer;

  @Column({ type: 'bytea', nullable: true })
  avatar_medium?: Buffer;

  @Column({ type: 'bytea', nullable: true })
  avatar_large?: Buffer;

  @Column({ type: 'varchar', nullable: true })
  avatar_mime?: string;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
