import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PriceEvent } from '../prices/price-event.entity';

@Entity({ name: 'stores' })
export class Store {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text', unique: true })
  slug!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  chain!: string;

  @Column({ type: 'text' })
  city!: string;

  @Column({ type: 'text' })
  district!: string;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitude!: string | null;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude!: string | null;

  @OneToMany(() => PriceEvent, (priceEvent) => priceEvent.store)
  priceEvents!: PriceEvent[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
