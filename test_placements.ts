import { TrashPlacementSystem } from './src/systems/TrashPlacementSystem';
import fs from 'fs';

const items = JSON.parse(fs.readFileSync('./src/data/items.json', 'utf8'));
const venues = JSON.parse(fs.readFileSync('./src/data/venues.json', 'utf8'));
const techStartup = venues.find((v: any) => v.id === 'tech_startup');
const startupItems = items.filter((i: any) => i.venueIds.includes('tech_startup'));

const placements = TrashPlacementSystem.generatePlacements(startupItems, techStartup.spawnZones, []);
console.log(JSON.stringify(placements, null, 2));
