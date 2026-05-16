import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';
import { Store } from '../stores/store.entity';

export enum PriceEventType {
  Regular = 'regular',
  Promotion = 'promotion',
  Member = 'member',
  Online = 'online',
  InStore = 'in_store',
}

@Entity({ name: 'price_events' })
@Index(['productId', 'observedAt'])
@Index(['storeId', 'observedAt'])
export class PriceEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @Column({ type: 'uuid' })
  storeId!: string;

  @ManyToOne(() => Product, (product) => product.priceEvents, {
    nullable: false,
  })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @ManyToOne(() => Store, (store) => store.priceEvents, { nullable: false })
  @JoinColumn({ name: 'storeId' })
  store!: Store;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  priceAmount!: string;

  @Column({ type: 'char', length: 3, default: 'SEK' })
  currency!: string;

  @Column({ type: 'text', nullable: true })
  unit!: string | null;

  @Column({
    type: 'enum',
    enum: PriceEventType,
    default: PriceEventType.Regular,
  })
  priceType!: PriceEventType;

  @Column({ type: 'timestamptz' })
  observedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  validFrom!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  validTo!: Date | null;

  @Column({ type: 'text', nullable: true })
  sourceType!: string | null;

  @Column({ type: 'text', nullable: true })
  sourceUrl!: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  confidenceScore!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  rawSnapshot!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
