import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PriceEvent } from '../prices/price-event.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text', unique: true })
  slug!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  brand!: string | null;

  @Column({ type: 'text' })
  category!: string;

  @Column({ type: 'text' })
  unit!: string;

  @OneToMany(() => PriceEvent, (priceEvent) => priceEvent.product)
  priceEvents!: PriceEvent[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
