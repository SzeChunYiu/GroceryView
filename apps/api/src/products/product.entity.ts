import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PriceEvent } from '../prices/price-event.entity';

@Entity({ name: 'products' })
@Index(['slug'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  brand!: string | null;

  @Column({ type: 'text', nullable: true })
  barcode!: string | null;

  @Column({ type: 'text', nullable: true })
  category!: string | null;

  @Column({ type: 'text', nullable: true })
  unit!: string | null;

  @OneToMany(() => PriceEvent, (priceEvent) => priceEvent.product)
  priceEvents!: PriceEvent[];
}
