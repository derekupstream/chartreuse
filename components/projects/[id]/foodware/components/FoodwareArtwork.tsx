import Image from 'next/image';

const artworkById: Record<string, { src: string; height?: number; width?: number }> = {
  '150': { src: '/images/foodware/9_in_plate.png', height: 100 },
  '149': { src: '/images/foodware/11_in_plate.png', height: 100 },
  '124': { src: '/images/foodware/fork.png', width: 100 },
  '125': { src: '/images/foodware/spoon.png', width: 100 },
  '126': { src: '/images/foodware/knife.png', height: 100 },
  '165': { src: '/images/foodware/14_oz_bowl.png', height: 100 },
  '164': { src: '/images/foodware/20_oz_bowl.png', width: 100 },
  '169': { src: '/images/foodware/16_oz_cup.png', height: 100 },
  '170': { src: '/images/foodware/22_oz_cup.png', height: 100 },
  '171': { src: '/images/foodware/waterstation.png', width: 100 },
  '172': { src: '/images/foodware/16_oz_cup.png', height: 100 } // 8 oz cup
};

export function FoodwareArtwork({ reusableProductId }: { reusableProductId: string }) {
  const artwork = artworkById[reusableProductId as keyof typeof artworkById];
  if (!artwork) {
    return null;
  }
  const { src, height, width } = artwork;
  return (
    <div style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={src} alt='' width={width || 'auto'} height={height || 'auto'} />
    </div>
  );
}
