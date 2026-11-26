import type { PrismaClient, Brand } from '@prisma/client';

export async function seedBrands(prisma: PrismaClient) {
  const brandData = [
    { name: 'PureGlow Skincare', code: 'PGS' },
    { name: 'VerdantLeaf Nutrition', code: 'VLN' },
    { name: 'Silkstream Apparel', code: 'SSA' },
    { name: 'HomeNest Essentials', code: 'HNE' },
    { name: 'VitalEdge Supplements', code: 'VES' },
    { name: 'UrbanThread Fashion', code: 'UTF' },
    { name: 'AuraBloom Beauty', code: 'ABB' },
    { name: 'CraftCove Home', code: 'CCH' },
    { name: 'PeakFuel Wellness', code: 'PFW' },
    { name: 'SoftHaven Textiles', code: 'SHT' },
    { name: 'NourishPath Foods', code: 'NPF' },
    { name: 'RadiantSkin Labs', code: 'RSL' },
    { name: 'ActiveFit Gear', code: 'AFG' },
    { name: 'CozyNook Living', code: 'CNL' },
    { name: 'GreenVine Organics', code: 'GVO' },
    { name: 'LuxeLayer Accessories', code: 'LLA' },
    { name: 'FreshHaven Groceries', code: 'FHG' },
    { name: 'PureTone Wellness', code: 'PTW' },
    { name: 'StitchCraft Apparel', code: 'SCA' },
    { name: 'BloomField Gardens', code: 'BFG' },
  ];

  const brands = await Promise.all(
    brandData.map((brand) => prisma.brand.create({ data: brand }))
  );

  return { brands };
}
