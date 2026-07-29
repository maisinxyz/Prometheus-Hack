To do list:

1. Add drawings for the background of each level.
2. Add drawings for the trash.
3. Fix the levelling up mechanic, make it so that the next level is available after completing the current level. // DONE
4. Fix the "interactable" trash (Soda can with soda inside, Food containers with food inside and plastic lining, etc.) // DONE
5. Add more interactable trash. Add atleast 2 for the each new level. (For the office one could be papers that have to be shredded first.)
6. Dynamically generate trash depednign on the level. Each level should have different types of trash and amounts of certain types of trash depedning on location. (Office has mroe paper, than food, hotdog stand has more food trash.)
7. Make each level environment have interactable features. (Ex. shredder in the office)
8. Fix the image for the Landing page and the levels screen. Make levels screen look better. 
    -> Possibly make itereations of the levels screen so that if a level is not passed, the environment looks more polluted.
9. Fix the points sytem, sometimes it removes poitns and adds points even though the item is properly thrown away. // DONE



Levels:

- [X] **Construction Site (construction_site)**
  - [ ] clean_sawdust_pile
  - [ ] broken_brick_piece
  - [ ] yellow_caution_tape
  - [ ] cement_mix_bag
  - [ ] rusty_nail
  - [ ] cracked_hard_hat
  - [ ] wood_scrap
  - [ ] drywall_scrap

- [X] **Ferry at the Docks (ferry_docks)**
  - [ ] ferry_ticket
  - [ ] barnacle_cup
  - [ ] tourist_map
  - [ ] soggy_fries
  - [ ] seasickness_pill_foil
  - [ ] rusty_boat_cleat
  - [ ] foam_life_preserver_piece
  - [ ] tangled_fishing_line
  - [ ] rusty_fishing_hook
  - [ ] barnacle_shell

- [ ] **Tech Startup (tech_startup)**
  - [ ] broken_ethernet_cable
  - [ ] vr_headset_foam
  - [ ] keyboard_keycap
  - [ ] sticky_note
  - [ ] empty_yerba_mate_can
  - [ ] energy_drink_can
  - [ ] empty_soylent_bottle
  - [ ] vr_headset_strap
  - [ ] broken_usb_drive
  - [ ] protein_bar_wrapper

- [ ] **Subway Station (subway_station)**
  - [ ] metro_card
  - [ ] newspaper
  - [ ] gum_wrapper
  - [ ] chewed_gum
  - [ ] pizza_box_greasy
  - [ ] cigarette_butt
  - [ ] glass_bottle
  - [ ] chip_bag
  - [ ] crumpled_newspaper
  - [ ] discarded_face_mask

- [ ] **Fitness Center (gym)**
  - [ ] protein_shake_bottle
  - [ ] sweat_towel
  - [ ] energy_bar_wrapper
  - [ ] banana_peel
  - [ ] broken_jump_rope
  - [ ] sports_drink_can
  - [ ] yoga_mat_piece
  - [ ] shoe_box
  - [ ] sweaty_towel_scrap
  - [ ] empty_preworkout_tub

- [ ] **Public Library (public_library)**
  - [ ] overdue_notice
  - [ ] laminated_bookmark
  - [ ] used_teabag
  - [ ] broken_reading_glasses
  - [ ] chewed_pencil
  - [ ] cd_jewel_case
  - [ ] encyclopedia_page
  - [ ] book_dust_jacket
  - [ ] torn_book_page
  - [ ] empty_ink_cartridge

- [ ] **Art Studio (art_studio)**
  - [ ] squeezed_paint_tube
  - [ ] dried_clay_chunk
  - [ ] sketchbook_scrap
  - [ ] dirty_paint_brush
  - [ ] canvas_scrap
  - [ ] empty_turpentine_bottle
  - [ ] orange_peel
  - [ ] eraser_shavings
  - [ ] used_paint_palette
  - [ ] dried_clay_lump

- [ ] **Financial District Office (financial_district_office)**
  - [ ] paper_plate
  - [ ] plastic_fork
  - [ ] coffee_cup
  - [ ] coffee_cup_lid
  - [ ] napkin_clean
  - [ ] napkin_greasy
  - [ ] plastic_water_bottle
  - [ ] aluminum_soda_can
  - [ ] paper_straw_wrapper
  - [ ] plastic_straw

- [ ] **Central Park (central_park)**
  - [ ] paper_plate
  - [ ] plastic_fork
  - [ ] food_scraps
  - [ ] coffee_cup
  - [ ] coffee_cup_lid
  - [ ] napkin_clean
  - [ ] napkin_greasy
  - [ ] apple_core
  - [ ] plastic_water_bottle
  - [ ] aluminum_soda_can

- [ ] **Times Square (times_square)**
  - [ ] paper_plate
  - [ ] plastic_fork
  - [ ] food_scraps
  - [ ] coffee_cup
  - [ ] coffee_cup_lid
  - [ ] napkin_clean
  - [ ] napkin_greasy
  - [ ] apple_core
  - [ ] plastic_water_bottle
  - [ ] aluminum_soda_can

- [ ] **NYC Hospital (nyc_hospital)**
  - [ ] latex_gloves
  - [ ] iv_saline_bag
  - [ ] paper_prescription
  - [ ] gauze_bandage
  - [ ] medicine_box
  - [ ] syringe_cap
  - [ ] cotton_swabs
  - [ ] pill_blister_pack
  - [ ] used_tissue_box
  - [ ] empty_pill_bottle

- [ ] **Hot Dog Stand (hot_dog_stand)**
  - [ ] paper_plate
  - [ ] plastic_fork
  - [ ] food_scraps
  - [ ] napkin_clean
  - [ ] napkin_greasy
  - [ ] plastic_water_bottle
  - [ ] aluminum_can
  - [ ] half_eaten_hot_dog
  - [ ] hot_dog_bun_scraps
  - [ ] used_mustard_packet

- [ ] **Mackenzie Cafe (mackenzie_cafe)**
  - [ ] coffee_cup
  - [ ] coffee_cup_lid
  - [ ] napkin_clean
  - [ ] napkin_greasy
  - [ ] soda_fanta_full
  - [ ] soda_pepsi_full
  - [ ] soda_fanta_empty
  - [ ] soda_pepsi_empty
  - [ ] foodbox_full
  - [ ] foodbox_empty







  Act as an expert developer and technical artist. Your task is to write a single, self-contained program that generates 2D vector graphics (SVG files) for a specific list of trash items.

Please adhere to the following strict requirements:

1. Purely Code-Generated: Do not fetch, download, or link to any external images or assets. All graphics must be generated entirely through code by constructing SVG XML strings (using paths, polygons, and standard shapes) directly within the C++ program.
2. Consistent Visual Style: Ensure all generated graphics share an identical art style. Use a clean, modern "flat vector" style. Enforce a cohesive color palette, consistent shading/lighting angles, and uniform stroke weights across every single item.
3. Identifiability over Clutter: The graphics should include fine details (like the ridges on a can or the folds on a piece of paper), but prioritizing readibility is paramount. The silhouettes and core colors must make each piece of trash instantly identifiable at a glance. 
4. Output Format: Provide the complete, compilable C++ source code. When executed, the program must automatically generate and save a separate `.svg` file for each item on the list. Use standard C++ libraries (`<iostream>`, `<fstream>`, `<string>`) to construct and write the files.

Here is the list of trash items:






Act as an expert game systems developer and spatial algorithms engineer. Your task is to write a comprehensive module that parses environmental backgrounds and implements intelligent, context-aware spatial placement rules for 2D/3D trash items within a scene.

Please adhere to the following strict requirements:

1. Environment & Surface Parsing: The system must analyze the background layout (using coordinate grids, heightmaps, or semantic segmentation masks) to accurately identify and classify distinct surface types, including ground levels, grass zones, structural floors, benches, and tabletops.
2. Context-Aware Placement Logic: Implement rule-based placement constraints reflecting real-world physics and human behavior. For example:
   - Items like cups, cans, and wrappers can sit on horizontal surfaces (tables, benches) or the ground.
   - Heavy or organic items (like discarded food or large debris) align naturally with grass, dirt, or ground-level geometry.
   - Prevent impossible configurations (e.g., objects floating in mid-air, clipping through solid structures, or sitting halfway inside a bench asset).
3. Collision & Snapping System: Include an automated collision/snapping pass that anchors item coordinates to the nearest valid surface boundary, adjusting the Y-axis (or depth plane) to match the surface elevation and adding slight rotation/jitter for natural scatter.
4. Output & Integration: Provide clean, well-documented C++ code that takes a background scene layout and a list of trash items, processes their spatial anchors, and outputs the final transformed coordinates or a rendered composite scene file. Use standard C++ libraries and efficient data structures.