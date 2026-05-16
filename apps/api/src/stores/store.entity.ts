import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PriceEvent } from '../prices/price-event.entity';

@Entity({ name: 'stores' })
@Index(['chain', 'city'])
@Index(['slug'], { unique: true })
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  slug!: string;

  @Column({ type: 'text' })
  chain!: string;

  @Column({ type: 'text', default: 'Stockholm' })
  city!: string;

  @Column({ type: 'text', nullable: true })
  district!: string | null;

  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  @OneToMany(() => PriceEvent, (priceEvent) => priceEvent.store)
  priceEvents!: PriceEvent[];
}
