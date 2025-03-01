import { type Metadata } from "next"
import { cookies } from "next/headers"
import Link from "next/link"
import { db } from "@/db"
import { carts } from "@/db/schema"
import { eq } from "drizzle-orm"

import { productCategories } from "@/config/products"
import { cn } from "@/lib/utils"
import { BoardBuilder } from "@/components/board-builder"
import { Header } from "@/components/header"
import { Shell } from "@/components/shell"
import { getProductsAction } from "@/app/_actions/product"

export const metadata: Metadata = {
  title: "Build a Board",
  description: "Select the components for your board",
}

interface BuildABoadPageProps {
  searchParams: {
    [key: string]: string | string[] | undefined
  }
}

export default async function BuildABoardPage({
  searchParams,
}: BuildABoadPageProps) {
  const { page, per_page, sort, subcategory, price_range } = searchParams

  // Products transaction
  const limit = typeof per_page === "string" ? parseInt(per_page) : 8
  const offset = typeof page === "string" ? (parseInt(page) - 1) * limit : 0
  const activeSubcategory =
    typeof subcategory === "string" ? subcategory : "decks"

  const productsTransaction = await getProductsAction({
    limit,
    offset,
    sort: typeof sort === "string" ? sort : null,
    subcategories: activeSubcategory,
    price_range: typeof price_range === "string" ? price_range : null,
  })

  const pageCount = Math.ceil(productsTransaction.total / limit)

  // Get cart items
  const cartId = Number(cookies().get("cartId")?.value)
  const cart = await db.query.carts.findFirst({
    columns: {
      items: true,
    },
    where: eq(carts.id, cartId),
  })
  const cartProductIds = cart?.items?.map((item) => item.productId) ?? []
  console.log(cartProductIds)

  return (
    <Shell className="gap-4">
      <Header
        title="Build a Board"
        description="Select the components for your board"
        size="sm"
      />
      <div className="sticky top-14 z-30 w-full shrink-0 overflow-hidden bg-background pt-4">
        <div className="inline-flex w-full items-center overflow-x-auto border-b p-1 text-muted-foreground shadow-2xl">
          {productCategories[0]?.subcategories.map((subcategory) => (
            <Link
              aria-label={subcategory.title}
              key={subcategory.title}
              href={`/build-a-board?subcategory=${subcategory.slug}`}
            >
              <div
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded border-b-2 border-transparent px-3 py-1.5 text-sm font-medium ring-offset-background transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  subcategory.slug === activeSubcategory &&
                    "rounded-none border-primary text-foreground hover:rounded-t"
                )}
              >
                {subcategory.title}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <BoardBuilder
        products={productsTransaction.items}
        pageCount={pageCount}
        subcategory={activeSubcategory}
        cartProductIds={cartProductIds}
      />
    </Shell>
  )
}
