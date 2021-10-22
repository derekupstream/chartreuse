import { useState, useEffect } from "react";
import { Button, Form } from "antd";
import * as S from "../styles";
import { PRODUCT_CATEGORIES } from "api/calculator/constants/product-categories";
import { MATERIALS } from "api/calculator/constants/materials";
import { PRODUCT_TYPES } from "api/calculator/constants/product-types";
import { SingleUseProduct } from "api/calculator/types/products";
import styled from "styled-components";
import { SingleUseLineItem } from "api/calculator/types/projects";

const StyledFormItem = styled(Form.Item)`
  .ant-form-item-label label {
    font-size: 18px;
    font-weight: 500;
    height: auto;
    &:after {
      content: "";
    }
  }
`;

type FilteredProductsProps = {
  categories: SingleUseProduct[];
  types: SingleUseProduct[];
  materials: SingleUseProduct[];
  sizes: SingleUseProduct[];
};

export default function SelectProductStep({
  input,
  onSubmit,
  products,
}: {
  input?: Partial<SingleUseLineItem>;
  onSubmit: (productId: string) => void;
  products: SingleUseProduct[];
}) {
  const [step, setStep] = useState<number>(0);
  const [options, setOptions] = useState<any[]>([
    { title: "Category", items: PRODUCT_CATEGORIES },
    { title: "Product type", items: [] },
    { title: "Material", items: [] },
    {
      title: "Size", // I will create the sizes next PR
      items: [],
    },
  ]);

  // set the values if we already have a product
  useEffect(() => {
    if (input?.productId) {
      const product = products.find((p) => p.id === input.productId);
      if (product) {
        onSelectCategory(product.category, "Category");
        options[0].defaultValue = product.category;
        onSelectCategory(product.type, "Product type");
        options[1].defaultValue = product.type;
        onSelectCategory(product.primaryMaterial, "Material");
        options[2].defaultValue = product.primaryMaterial;
        onSelectCategory(product.id, "Size"); // we use the product id when user selects the size
        options[3].defaultValue = product.id;
        setSelectedProductId(product.id);
        setOptions([...options]);
        setStep(3);
      }
    }
  }, [input]);

  const [filteredProducts, setFilteredProducts] =
    useState<FilteredProductsProps>({
      categories: [],
      types: [],
      materials: [],
      sizes: [],
    });

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );

  function onSelectCategory(value: number | string, type: string) {
    let newProducts: SingleUseProduct[] = [];
    let items: any[] = [];

    if (type === "Category") {
      setStep(1);
      newProducts = products.filter((product) => product.category === value);
      PRODUCT_TYPES.forEach((productType) => {
        newProducts.forEach((newProduct) => {
          if (
            productType.id === newProduct.type &&
            !items.some((item) => item.id === productType.id)
          ) {
            items.push(productType);
          }
        });
      });
      options[1] = { title: "Product type", items };
      filteredProducts.categories = newProducts;
      setFilteredProducts({ ...filteredProducts, categories: newProducts });
    }

    if (type === "Product type") {
      setStep(2);
      newProducts = Object.values(filteredProducts.categories).filter(
        (product) => {
          return product.type === value;
        }
      );
      MATERIALS.forEach((material) => {
        newProducts.forEach((newProduct) => {
          if (
            material.id === newProduct.primaryMaterial &&
            !items.some((item) => item.id === material.id)
          ) {
            items.push(material);
          }
        });
      });
      options[2] = { title: "Material", items };
      setFilteredProducts({ ...filteredProducts, types: newProducts });
    }

    if (type === "Material") {
      setStep(3);
      newProducts = Object.values(filteredProducts.types).filter(
        (product) => product.primaryMaterial === value
      );
      setFilteredProducts({ ...filteredProducts, materials: newProducts });

      const sizes: any[] = [];
      newProducts.forEach((filteredProduct) => {
        sizes.push({ name: filteredProduct.size, id: filteredProduct.id });
      });
      options[3] = { title: "Size", items: sizes };
      setFilteredProducts({ ...filteredProducts, sizes: newProducts });
    }

    if (type === "Size") {
      const filteredProduct = filteredProducts.sizes.find(
        (product) => product.id === value
      );
      if (filteredProduct) {
        setSelectedProductId(filteredProduct.id);
      }
    }

    setOptions(options);
    return filteredProducts;
  }

  function _onSubmit() {
    if (selectedProductId) {
      onSubmit(selectedProductId);
    }
  }

  return (
    <Form layout="vertical">
      {options.map((option, index) => (
        <ProductPropertySelection
          defaultValue={option.defaultValue}
          key={option.title}
          show={step >= index}
          items={option.items}
          title={option.title}
          onSelectCategory={onSelectCategory}
        />
      ))}
      <S.BoxEnd>
        <div></div>
        <Button
          type="primary"
          disabled={!selectedProductId}
          onClick={_onSubmit}
        >
          {"Next >"}
        </Button>
      </S.BoxEnd>
    </Form>
  );
}

type SelectionProps = {
  defaultValue?: number | string;
  title: string;
  onSelectCategory: (value: number, type: string) => void;
  items: any;
  show: boolean;
};

function ProductPropertySelection({
  defaultValue,
  title,
  items,
  show,
  onSelectCategory,
}: SelectionProps) {
  if (!show) {
    return <StyledFormItem label={title} />;
  }
  return (
    <>
      <StyledFormItem label={title}>
        <S.OptionSelection
          options={items.map((item: any) => ({
            label: item.name,
            value: item.id,
          }))}
          onChange={(e) => onSelectCategory(e.target.value, title)}
          defaultValue={defaultValue}
          optionType="button"
        />
      </StyledFormItem>
    </>
  );
}
