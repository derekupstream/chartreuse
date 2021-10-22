import { Button, Drawer, Typography } from "antd";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import SingleUseForm from "./single-use-form";
import * as S from "../styles";
import { useEffect } from "react";
import { SingleUseProduct } from "api/calculator/types/products";
import { SingleUseLineItem } from "api/calculator/types/projects";
import { GET } from "lib/http";
import { Project } from ".prisma/client";
import { DashboardUser } from "components/dashboard";
import { PRODUCT_CATEGORIES } from "api/calculator/constants/product-categories";

type ServerSideProps = {
  project: Project;
  user: DashboardUser;
};

interface SingleUseItemRecord {
  lineItem: SingleUseLineItem;
  product: SingleUseProduct;
}

export default function SingleUse({ project }: ServerSideProps) {
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false);
  const [lineItem, setLineItem] = useState<Partial<SingleUseLineItem>>({});
  const [lineItems, setLineItems] = useState<SingleUseLineItem[]>([]);
  const [products, setProducts] = useState<SingleUseProduct[]>([]);

  useEffect(() => {
    getProducts();
    getLineItems();
  }, []);

  async function getProducts() {
    try {
      const products = await GET<SingleUseProduct[]>(
        "/api/inventory/single-use-products"
      );
      setProducts(products);
    } catch (error) {
      //
    }
  }

  async function getLineItems() {
    try {
      const { lineItems } = await GET<{ lineItems: SingleUseLineItem[] }>(
        `/api/projects/${project.id}/single-use-items`
      );
      setLineItems(lineItems);
    } catch (error) {
      //
    }
  }

  function addItem() {
    setLineItem({});
    setIsDrawerVisible(true);
  }

  function closeDrawer() {
    setIsDrawerVisible(false);
  }

  function onSubmitNewProduct() {
    closeDrawer();
    getLineItems();
  }

  const items = lineItems.reduce<{
    [categoryId: string]: SingleUseItemRecord[];
  }>((items, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      const record: SingleUseItemRecord = {
        lineItem: item,
        product,
      };
      items[product.category] = items[product.category] || [];
      items[product.category].push(record);
    }
    return items;
  }, {});

  return (
    <S.Wrapper>
      <Typography.Title level={2}>Single-use purchasing</Typography.Title>
      <Typography.Title level={4} css="max-width: 80%;">
        Next: Create an inventory of all single-use items you purchase
        regularly. If a close match doesn&apos;t exist in the system, please
        contact Upstream to add to the single-use product database.
      </Typography.Title>
      <Button type="primary" onClick={addItem} icon={<PlusOutlined />}>
        Add item
      </Button>
      {PRODUCT_CATEGORIES.map(
        (category) =>
          items[category.id] && (
            <div key={category.id}>
              <Typography.Title level={4}>{category.name}</Typography.Title>
              {items[category.id].map((item) => (
                <Typography.Paragraph key={item.product.id}>
                  {item.product.title} - {item.lineItem.casesPurchased} cases at
                  ${item.lineItem.caseCost} ({item.lineItem.frequency})
                </Typography.Paragraph>
              ))}
            </div>
          )
      )}
      <Drawer
        title="Add single-use item"
        placement="right"
        onClose={closeDrawer}
        visible={isDrawerVisible}
        contentWrapperStyle={{ width: "600px" }}
      >
        <SingleUseForm
          lineItem={lineItem}
          projectId={project.id}
          products={products}
          onSubmit={onSubmitNewProduct}
        />
      </Drawer>
    </S.Wrapper>
  );
}
