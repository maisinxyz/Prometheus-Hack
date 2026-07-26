import json

with open('src/data/items.json', 'r') as f:
    items = json.load(f)

for item in items:
    # Default zone assignments based on item id for demonstration
    if item['id'] in ['coffee_cup', 'coffee_cup_lid', 'soda_fanta_full', 'foodbox_full', 'half_eaten_muffin', 'iced_tea_with_lemon']:
        item['allowedZones'] = ['TableZone']
    elif item['id'] in ['napkin_clean', 'napkin_greasy', 'sugar_packet', 'receipt']:
        item['allowedZones'] = ['TableZone', 'GroundZone']
    elif item['id'] in ['clean_sawdust_pile', 'broken_brick_piece', 'cement_mix_bag', 'rusty_nail', 'cracked_hard_hat', 'wood_scrap', 'drywall_scrap']:
        item['allowedZones'] = ['GroundZone']

with open('src/data/items.json', 'w') as f:
    json.dump(items, f, indent=2)
