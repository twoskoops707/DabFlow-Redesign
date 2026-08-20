'use strict';

const CONCENTRATE_BRANDS = [
  { name: 'Raw Garden',           specialty: 'Live Resin',           strains: ['Blueberry Headband', 'Mimosa', 'Wedding Cake', 'Blue Dream', 'Zkittlez', 'Strawberry Cough', 'Sundae Driver'] },
  { name: 'Cresco',               specialty: 'Live Resin / Sauce',   strains: ['Lemon Tree', 'Forbidden Fruit', 'Kush Mints', 'Sour Diesel', 'MAC 1', 'Ice Cream Cake'] },
  { name: 'Jetty Extracts',       specialty: 'Live Resin',           strains: ['Tangie', 'OG Kush', 'Gorilla Glue #4', 'Sherbert', 'Blue Dream', 'Ghost Train Haze'] },
  { name: '710 Labs',             specialty: 'Rosin / Live Resin',   strains: ['Papaya', 'MAC 1', 'Zkittlez', 'The Soap', 'Gushers', 'Banana Punch', 'GMO'] },
  { name: 'Alien Labs',           specialty: 'Live Resin / Rosin',   strains: ['Area 41', 'Melonade', 'Baklava', 'Zkittlez', 'Slurricane', 'Atomic Apple'] },
  { name: 'Connected Cannabis',   specialty: 'Live Resin / Rosin',   strains: ['Biscotti', 'Gushers', 'Runtz', 'Gelato 41', 'Jealousy', 'MAC 1'] },
  { name: 'Moxie',                specialty: 'Wax / Sauce',          strains: ['Gorilla Glue #4', 'Strawberry Banana', 'GSC', 'Sour Diesel', 'White Fire OG', 'Jack Herer'] },
  { name: 'Stiiizy',              specialty: 'Live Resin',           strains: ['Watermelon Z', 'Lemon Tree', 'Biscotti', 'OG Kush', 'Blue Dream', 'Skywalker OG'] },
  { name: 'Viola',                specialty: 'Live Resin / Sauce',   strains: ['Forbidden Fruit', 'Gelato', 'Wedding Cake', 'Blue Slushie', 'Purple Punch'] },
  { name: 'Punch Extracts',       specialty: 'Live Rosin',           strains: ['Purple Punch', 'Banana Punch', 'Mimosa', 'Ice Cream Cake', 'Papaya'] },
  { name: 'Beezle Extracts',      specialty: 'Live Resin / Sauce',   strains: ['Zkittlez', 'Gelato', 'Sunset Sherbert', 'Purple Punch', 'Wedding Cake', 'Mimosa'] },
  { name: 'Bloom Farms',          specialty: 'Live Resin',           strains: ['Blue Dream', 'Pineapple Express', 'Sour Diesel', 'Gelato', 'Tangie'] },
  { name: 'Extractioneers',       specialty: 'Live Resin / Rosin',   strains: ['Papaya', 'Permanent Marker', 'Tropicana Cookies', 'MAC 1', 'Pink Runtz'] },
  { name: 'Canamo',               specialty: 'Live Rosin',           strains: ['Papaya', 'Permanent Marker', 'Gushers', 'Jealousy', 'Biscotti'] },
  { name: 'Presidential',         specialty: 'Wax / Crumble',        strains: ['OG Kush', 'Jack Herer', 'Granddaddy Purple', 'GSC', 'Trainwreck', 'Blue Dream'] },
  { name: 'Phat Panda',           specialty: 'Shatter / Sauce',      strains: ['Blueberry Headband', 'Lemon Kush', 'GSC', 'Pineapple Express', 'Zkittlez', 'Purple Punch'] },
  { name: 'Guild Extracts',       specialty: 'Shatter / Live Resin', strains: ['OG Kush', 'GSC', 'Gorilla Glue #4', 'Skywalker OG', 'White Widow'] },
  { name: 'Emerald Bay Extracts', specialty: 'BHO / Live Resin',     strains: ['Sherbert', 'Gorilla Glue #4', 'Bruce Banner', 'Headband', 'Lemon Skunk'] },
  { name: 'Kosmik Extracts',      specialty: 'Live Resin / Rosin',   strains: ['Mimosa', 'Watermelon Zkittlez', 'Biscotti', 'Runtz', 'GMO Cookies'] },
  { name: 'Proper Cannabis',      specialty: 'Live Resin / Wax',     strains: ['Wedding Cake', 'Sundae Driver', 'Forbidden Fruit', 'Lemon Tree', 'Ice Cream Cake'] },
  { name: 'Heylo Cannabis',       specialty: 'CO2 Extract',          strains: ['Blue Dream', 'Tangie', 'Cherry Pie', 'Granddaddy Purple', 'Pineapple Express'] },
  { name: 'Kanha',                specialty: 'Live Resin',           strains: ['Tangie', 'Zkittlez', 'Watermelon', 'Blue Dream', 'Pineapple'] },
  { name: 'Extraction Artisans',  specialty: 'Solventless / Rosin',  strains: ['Gushers', 'Zkittlez', 'Gary Payton', 'Runtz', 'Apple Fritter'] },
  { name: 'Cali Terpenes',        specialty: 'Live Resin / Sauce',   strains: ['Lemon Haze', 'OG Kush', 'Blue Dream', 'Gelato', 'Durban Poison'] },
  { name: 'Olio',                 specialty: 'HTFSE / Live Resin',   strains: ['Gelato 33', 'Ice Cream Cake', 'Sunset Sherbert', 'MAC 1', 'Biscotti'] },
];

const TOP_STRAINS = [
  'OG Kush', 'Sour Diesel', 'Blue Dream', 'Gorilla Glue #4', 'GSC',
  'Gelato', 'Gelato 33', 'Gelato 41', 'Wedding Cake', 'Zkittlez',
  'Runtz', 'Pink Runtz', 'White Runtz', 'MAC 1', 'Mimosa',
  'Forbidden Fruit', 'Sunset Sherbert', 'Purple Punch', 'Biscotti', 'Gushers',
  'Ice Cream Cake', 'Lemon Tree', 'Tangie', 'Papaya', 'GMO Cookies',
  'Jack Herer', 'Trainwreck', 'Pineapple Express', 'Granddaddy Purple', 'Blueberry',
  'Skywalker OG', 'White Fire OG', 'Bruce Banner', 'Headband', 'Strawberry Banana',
  'Banana Punch', 'Slurricane', 'Gary Payton', 'Jealousy', 'Permanent Marker',
  'Tropicana Cookies', 'Apple Fritter', 'Sundae Driver', 'Kush Mints', 'Watermelon Z',
  'Ghost Train Haze', 'Durban Poison', 'Cherry Pie', 'Blueberry Headband', 'Banana OG',
  'Area 41', 'Melonade', 'Baklava', 'The Soap', 'Sherbert',
  'Lemon Haze', 'White Widow', 'Northern Lights', 'Lemon Skunk', 'Pink Runtz',
];

function populateBrandList() {
  const dl = document.getElementById('brand-list');
  if (!dl) return;
  dl.innerHTML = CONCENTRATE_BRANDS.map(b =>
    `<option value="${b.name}">${b.specialty}</option>`
  ).join('');
}

function updateStrainList(brandName) {
  const dl = document.getElementById('strain-list');
  if (!dl) return;
  const brand = CONCENTRATE_BRANDS.find(b => b.name === brandName);
  const strains = brand ? brand.strains : TOP_STRAINS;
  dl.innerHTML = strains.map(s => `<option value="${s}">`).join('');
}
