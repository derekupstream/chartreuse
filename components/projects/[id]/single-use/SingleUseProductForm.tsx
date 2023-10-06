import { Button, Divider, Form, Typography } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

import { MATERIALS } from 'lib/calculator/constants/materials';
import { PRODUCT_CATEGORIES } from 'lib/calculator/constants/product-categories';
import { PRODUCT_TYPES } from 'lib/calculator/constants/product-types';
import type { SingleUseProduct } from 'lib/inventory/types/products';
import type { SingleUseLineItem } from 'lib/inventory/types/projects';

import * as S from '../styles';

const StyledFormItem = styled(Form.Item)`
  .ant-form-item-label label {
    font-size: 18px;
    font-weight: 500;
    height: auto;
    &:after {
      content: '';
    }
  }
`;

const PRODUCT_FEATURES = [
  { title: 'Category' },
  { title: 'Product type' },
  { title: 'Material' },
  { title: 'Size' },
  { title: 'Product description' }
] as const;

type FeatureOptions = Record<(typeof PRODUCT_FEATURES)[number]['title'], { name: string; id: string | number }[]>;
type SelectedFeatureOptions = Record<
  (typeof PRODUCT_FEATURES)[number]['title'] | 'productId',
  string | number | undefined | null
>;

function getFormValues(features: SelectedFeatureOptions, products: SingleUseProduct[]) {
  const categories = PRODUCT_CATEGORIES.filter(category => products.some(p => p.category === category.id));
  let remainingProducts = features.Category ? products.filter(product => product.category === features.Category) : [];

  const types = PRODUCT_TYPES.filter(type => remainingProducts.some(product => product.type === type.id)).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  if (typeof features['Product type'] !== 'number' && types.length === 1) {
    features['Product type'] = types[0].id;
  }
  remainingProducts =
    typeof features['Product type'] === 'number'
      ? remainingProducts.filter(product => product.type === features['Product type'])
      : [];

  const materials = MATERIALS.filter(material =>
    remainingProducts.some(product => product.primaryMaterial === material.id)
  );
  if (typeof features.Material !== 'number' && materials.length === 1) {
    features.Material = materials[0].id;
  }
  remainingProducts =
    typeof features.Material === 'number'
      ? remainingProducts.filter(product => product.primaryMaterial === features.Material)
      : [];

  const sizes = remainingProducts
    .map(product => ({ name: product.size, id: product.size }))
    // find unique sizes since we are just grabbing them from list of products
    .filter((size, index, self) => self.findIndex(s => s.name === size.name) === index)
    .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10));
  if (!features.Size && sizes.length === 1) {
    features.Size = sizes[0].id;
  }
  remainingProducts = features.Size ? remainingProducts.filter(product => product.size === features.Size) : [];

  // if we have more than one product remaining but no sizes left, show the product descriptions to let the user decide
  let descriptions: { name: string; id: string }[] = [];
  if (features.Size && remainingProducts.length > 1) {
    descriptions = remainingProducts.map(product => ({ name: product.description, id: product.description }));
  }
  remainingProducts = features['Product description']
    ? remainingProducts.filter(product => product.description === features['Product description'])
    : remainingProducts;

  const productId = remainingProducts.length === 1 ? remainingProducts[0].id : null;

  const remainingOptions: FeatureOptions = {
    Category: categories,
    'Product type': types,
    Material: materials,
    Size: sizes,
    'Product description': descriptions
  };

  // console.log('remaining options', { sizes, descriptions, remainingProducts, features, productId, remainingOptions })

  return { features, productId, remainingOptions };
}

const featureDefaults = {
  productId: null,
  Category: null,
  'Product description': null,
  'Product type': null,
  Material: null,
  Size: null
};

export default function SelectProductStep({
  input,
  onSubmit,
  products
}: {
  input?: Partial<SingleUseLineItem>;
  onSubmit: (productId: string) => void;
  products: SingleUseProduct[];
}) {
  // get default values if they exist
  const { productId, features, remainingOptions } = getFormValues(featureDefaults, products);

  const [selected, setSelected] = useState<SelectedFeatureOptions>({ ...features, productId });
  const [options, setOptions] = useState<FeatureOptions>(remainingOptions);

  const selectFeatures = useCallback(
    (currentFeatures: SelectedFeatureOptions) => {
      const { productId, features, remainingOptions } = getFormValues(currentFeatures, products);
      setSelected({ ...features, productId });
      setOptions(remainingOptions);
    },
    [products]
  );

  function onSelect(value: string | number, feature: string) {
    if (feature === 'Category') {
      selectFeatures({
        Category: value,
        'Product type': null,
        Material: null,
        Size: null,
        'Product description': null,
        productId: null
      });
    } else if (feature === 'Product type') {
      selectFeatures({
        Category: selected.Category,
        'Product type': value,
        Material: null,
        Size: null,
        'Product description': null,
        productId: null
      });
    } else if (feature === 'Material') {
      selectFeatures({
        Category: selected.Category,
        'Product type': selected['Product type'],
        Material: value,
        Size: null,
        'Product description': null,
        productId: null
      });
    } else if (feature === 'Size') {
      selectFeatures({
        Category: selected.Category,
        'Product type': selected['Product type'],
        Material: selected.Material,
        Size: value,
        'Product description': null,
        productId: null
      });
    } else {
      selectFeatures({ ...selected, [feature]: value });
    }
  }

  useEffect(() => {
    // set the default values if we already have a product
    if (input?.productId) {
      const product = products.find(p => p.id === input.productId);
      if (product) {
        selectFeatures({
          productId: product.id,
          Category: product.category,
          'Product type': product.type,
          Material: product.primaryMaterial,
          'Product description': product.description,
          Size: product.size
        });
      }
    }
  }, [input, products, selectFeatures]);

  function _onSubmit() {
    if (selected.productId) {
      onSubmit(selected.productId as string);
    }
  }

  return (
    <Form layout='vertical'>
      <p>
        Select a product from our single-use product database. If a close match doesn&apos;t exist in the system, please
        contact Upstream at{' '}
        <a style={{ textDecoration: 'underline' }} href='mailto:chart-reuse@upstreamsolutions.org'>
          chart-reuse@upstreamsolutions.org
        </a>
        .
      </p>
      {PRODUCT_FEATURES.map(option => (
        <FeatureSelect
          value={selected[option.title]}
          key={option.title}
          items={options[option.title]}
          feature={option.title}
          onSelect={onSelect}
        />
      ))}
      <S.BoxEnd>
        <div></div>
        <Button size='large' type='primary' disabled={!selected.productId} onClick={_onSubmit}>
          {'Next'}
        </Button>
      </S.BoxEnd>
    </Form>
  );
}

type SelectionProps = {
  value?: number | string | null;
  feature: keyof SelectedFeatureOptions;
  onSelect: (value: number, feature: keyof SelectedFeatureOptions) => void;
  items: { name: string; id: string | number }[];
};

function FeatureSelect({ value, feature, items, onSelect }: SelectionProps) {
  if (!items.length) return null;
  return (
    <StyledFormItem label={feature}>
      <S.OptionSelection
        value={value}
        options={items.map((item: any) => ({
          label: item.name,
          value: item.id
        }))}
        onChange={(e: RadioChangeEvent) => onSelect(parseInt(e.target.value), feature)}
        optionType='button'
      />
    </StyledFormItem>
  );
}
