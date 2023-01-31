// we need to import the svg's here so that webpack will build React components using @svgr/webpack plugin
import UtensilsIcon from 'public/images/flaticon/svg/003-cutlery.svg';
import FoodwareIcon from 'public/images/flaticon/svg/006-food.svg';
import NapkinsIcon from 'public/images/flaticon/svg/007-napkin.svg';
import CondimentsIcon from 'public/images/flaticon/svg/016-sauce.svg';
import BeverageIcon from 'public/images/flaticon/svg/019-soda.svg';

// indices should line up with PRODUCT_CATEGORIES const
export const CATEGORY_ICONS = [<BeverageIcon key={0} />, <FoodwareIcon key={1} />, <UtensilsIcon key={2} />, <CondimentsIcon key={3} />, <NapkinsIcon key={4} />] as const;
