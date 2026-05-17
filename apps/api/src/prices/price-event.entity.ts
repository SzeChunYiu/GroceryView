import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';
import { Store } from '../stores/store.entity';

export enum PriceEventType {
  Regular = 'regular',
  Promotion = 'promotion',
  Member = 'member',
}

@Entity({ name: 'price_events' })
@Index(['productId', 'storeId', 'observedAt'])
export class PriceEvent {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ name: 'product_id', type: 'text' })
  productId!: string;

  @Column({ name: 'store_id', type: 'text' })
  storeId!: string;

  @ManyToOne(() => Product, (product) => product.priceEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product!: Product;

  @ManyToOne(() => Store, (store) => store.priceEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'id' })
  store!: Store;

  @Column({ name: 'price_amount', type: 'decimal', precision: 10, scale: 2 })
  priceAmount!: string;

  @Column({ type: 'char', length: 3, default: 'SEK' })
  currency!: 'SEK';

  @Column({ type: 'text' })
  unit!: string;

  @Column({ name: 'price_type', type: 'enum', enum: PriceEventType })
  priceType!: PriceEventType;

  @Column({ name: 'observed_at', type: 'timestamptz' })
  observedAt!: Date;

  @Column({ name: 'source_type', type: 'text' })
  sourceType!: string;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 4, scale: 3 })
  confidenceScore!: string;

  @Column({ name: 'source_run_id', type: 'text', nullable: true })
  sourceRunId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
