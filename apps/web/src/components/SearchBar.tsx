import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';

type SearchBarProps = {
  defaultQuery?: string;
  actionPath?: string;
  className?: string;
  placeholder?: string;
};

const defaultPlaceholder = 'Search for products and categories, e.g. kaffe, kyckling';

export function SearchBar({
  defaultQuery = '',
  actionPath = '/products',
  className = '',
  placeholder = defaultPlaceholder
}: Readonly<SearchBarProps>) {
  return (
    <form action={actionPath} className={`grocery-search-form ${className}`} method="get">
      <label className="grocery-search-label" htmlFor="site-search">
        <span className="sr-only">Search GroceryView</span>
      </label>
      <div className="grocery-search-input-wrap">
        <SearchIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          autoComplete="off"
          className="grocery-search-input"
          defaultValue={defaultQuery}
          id="site-search"
          name="q"
          placeholder={placeholder}
          type="search"
        />
      </div>
      <button className="grocery-search-submit" type="submit">
        Search
      </button>
      <Link className="grocery-search-advanced" href="/products">
        Browse all products
      </Link>
    </form>
  );
}
