#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>

void writeSVG(const std::string& filename, const std::string& content) {
    std::ofstream file(filename);
    if (file.is_open()) {
        file << "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
        file << "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" width=\"512\" height=\"512\">\n";
        file << "  <defs>\n";
        file << "    <style>\n";
        file << "      .shadow { fill: rgba(0,0,0,0.25); }\n";
        file << "      .highlight { fill: rgba(255,255,255,0.3); }\n";
        file << "      .outline { stroke: #1a1a1a; stroke-width: 8; stroke-linejoin: round; stroke-linecap: round; }\n";
        file << "    </style>\n";
        file << "  </defs>\n";
        file << content;
        file << "</svg>\n";
        file.close();
        std::cout << "Generated " << filename << std::endl;
    } else {
        std::cerr << "Failed to open " << filename << " for writing." << std::endl;
    }
}

int main() {
    std::map<std::string, std::string> items;

    // 1. Latex Gloves
    items["latex_gloves.svg"] = R"SVG(
        <g transform="rotate(15 256 256)">
            <!-- Flat blue crumpled gloves -->
            <path class="outline" fill="#87CEFA" d="M 150 150 Q 200 100 250 150 Q 280 180 270 250 Q 300 220 320 280 Q 350 350 300 400 Q 250 450 150 400 Q 80 350 120 250 Q 150 200 150 150 Z" opacity="0.9" />
            
            <!-- Fingers (twisted/empty) -->
            <path class="outline" fill="#87CEFA" d="M 250 150 Q 280 120 320 160 Q 300 190 270 250" opacity="0.9" />
            <path class="outline" fill="#87CEFA" d="M 320 280 Q 360 250 380 300 Q 350 340 300 400" opacity="0.9" />
            
            <!-- Folds and Creases -->
            <path fill="none" stroke="#4682B4" stroke-width="4" d="M 180 250 Q 220 280 160 350" />
            <path fill="none" stroke="#4682B4" stroke-width="4" d="M 220 300 Q 260 320 230 380" />
            <path fill="none" stroke="#4682B4" stroke-width="4" d="M 270 200 Q 230 250 250 280" />
            
            <!-- Rolled Cuff -->
            <path class="outline" fill="#B0E0E6" d="M 100 320 Q 120 280 150 230 Q 120 220 90 260 Z" />
            <path class="outline" fill="#B0E0E6" d="M 150 420 Q 200 450 250 420 Q 280 460 220 470 Z" />
        </g>
    )SVG";

    // 2. IV Saline Bag
    items["iv_saline_bag.svg"] = R"SVG(
        <g transform="rotate(-5 256 256)">
            <!-- Plastic Bag Body -->
            <rect x="180" y="100" width="150" height="250" rx="20" class="outline" fill="#E0FFFF" opacity="0.6" />
            
            <!-- Bag Top Loop -->
            <path class="outline" fill="none" stroke-width="8" d="M 230 100 Q 255 50 280 100" />
            
            <!-- Bottom ports -->
            <rect x="200" y="350" width="20" height="30" class="outline" fill="#87CEEB" />
            <rect x="290" y="350" width="20" height="30" class="outline" fill="#87CEEB" />
            <rect x="295" y="380" width="10" height="15" fill="#4682B4" />
            
            <!-- Label -->
            <rect x="200" y="150" width="110" height="150" class="outline" fill="#FFFFFF" />
            <rect x="205" y="155" width="100" height="30" fill="#32CD32" /> <!-- Green stripe -->
            <text x="215" y="175" font-family="sans-serif" font-size="16" font-weight="bold" fill="#FFF">0.9% NaCl</text>
            <text x="215" y="210" font-family="sans-serif" font-size="14" font-weight="bold" fill="#111">500 mL</text>
            
            <!-- Measurement marks -->
            <path fill="none" stroke="#111" stroke-width="2" d="M 290 220 L 305 220 M 295 240 L 305 240 M 290 260 L 305 260 M 295 280 L 305 280" />
            
            <!-- Water inside -->
            <path fill="#87CEEB" d="M 185 240 L 325 240 L 325 340 A 15 15 0 0 1 310 355 L 200 355 A 15 15 0 0 1 185 340 Z" opacity="0.4" />
            
            <!-- Plastic wrinkles -->
            <path fill="none" stroke="#FFF" stroke-width="4" d="M 190 120 Q 220 110 200 150 M 310 330 Q 280 340 310 300" opacity="0.8" />
        </g>
    )SVG";

    // 3. Paper Prescription
    items["paper_prescription.svg"] = R"SVG(
        <g transform="rotate(10 256 256)">
            <!-- Crumpled Paper -->
            <path class="outline" fill="#FDF5E6" d="M 120 120 L 380 100 L 400 380 L 140 400 Z" />
            
            <!-- Hospital Header -->
            <rect x="150" y="130" width="220" height="30" fill="#4682B4" transform="rotate(-3 150 130)" />
            <text x="160" y="150" font-family="sans-serif" font-size="16" font-weight="bold" fill="#FFF" transform="rotate(-3 160 150)">CITY GENERAL HOSPITAL</text>
            
            <!-- Rx Symbol -->
            <text x="145" y="200" font-family="serif" font-size="40" font-weight="bold" fill="#111">Rx</text>
            <path fill="none" stroke="#111" stroke-width="4" d="M 160 200 L 180 200" />
            
            <!-- Doctor Handwriting (Scribbles) -->
            <path fill="none" stroke="#0000CD" stroke-width="4" stroke-linecap="round" d="M 200 200 Q 230 190 210 210 T 320 200 T 250 230 T 350 220" />
            <path fill="none" stroke="#0000CD" stroke-width="3" stroke-linecap="round" d="M 160 260 Q 200 250 180 270 T 260 260 T 200 290 T 300 280" />
            
            <!-- Signature -->
            <path fill="none" stroke="#111" stroke-width="2" stroke-dasharray="2 4" d="M 250 350 L 380 340" />
            <path fill="none" stroke="#0000CD" stroke-width="4" stroke-linecap="round" d="M 260 340 Q 280 320 270 350 T 350 330 T 320 360" />
            
            <!-- Folds and Creases -->
            <path class="shadow" d="M 130 250 L 390 230 L 390 240 L 130 260 Z" opacity="0.3" />
        </g>
    )SVG";

    // 4. Gauze Bandage
    items["gauze_bandage.svg"] = R"SVG(
        <g transform="rotate(-15 256 256)">
            <!-- Bandage Roll Shape -->
            <ellipse cx="256" cy="200" rx="80" ry="120" class="outline" fill="#F8F8FF" transform="rotate(20 256 200)" />
            
            <!-- Inner roll rings -->
            <ellipse cx="256" cy="200" rx="60" ry="90" fill="none" stroke="#D3D3D3" stroke-width="4" transform="rotate(20 256 200)" />
            <ellipse cx="256" cy="200" rx="40" ry="60" fill="none" stroke="#D3D3D3" stroke-width="4" transform="rotate(20 256 200)" />
            <ellipse cx="256" cy="200" rx="20" ry="30" class="outline" fill="#D3D3D3" transform="rotate(20 256 200)" />
            
            <!-- Unrolled Strip -->
            <path class="outline" fill="#F8F8FF" d="M 330 240 Q 400 300 350 400 L 250 380 Q 280 300 220 260 Z" />
            
            <!-- Gauze Texture (Mesh Grid) -->
            <g opacity="0.3" stroke="#A9A9A9" stroke-width="2">
                <path d="M 320 260 L 350 250 M 300 280 L 360 270 M 280 300 L 370 290 M 260 320 L 370 310 M 240 340 L 360 330 M 230 360 L 350 350" />
                <path d="M 240 270 L 330 240 M 250 300 L 360 250 M 240 320 L 360 270 M 230 350 L 370 290 M 240 380 L 360 320" />
            </g>
            
            <!-- Blood/Iodine stain on the unrolled part -->
            <ellipse cx="300" cy="330" rx="25" ry="15" fill="#8B0000" opacity="0.6" transform="rotate(-30 300 330)" />
            <ellipse cx="280" cy="310" rx="15" ry="10" fill="#8B0000" opacity="0.4" transform="rotate(20 280 310)" />
            
            <!-- Frayed end -->
            <path fill="none" stroke="#D3D3D3" stroke-width="4" d="M 345 405 L 355 415 M 325 395 L 335 410 M 295 385 L 305 405" />
        </g>
    )SVG";

    // 5. Medicine Box
    items["medicine_box.svg"] = R"SVG(
        <g transform="rotate(25 256 256)">
            <!-- Box Body (Crushed) -->
            <path class="outline" fill="#FFFFFF" d="M 150 150 L 350 120 L 400 250 L 200 300 Z" />
            <path class="shadow" d="M 150 150 L 200 300 L 220 380 L 120 330 Z" />
            <path class="outline" fill="#F0F8FF" d="M 200 300 L 400 250 L 420 330 L 220 380 Z" />
            
            <!-- Flap Open -->
            <path class="outline" fill="#E6E6FA" d="M 120 330 L 220 380 L 150 420 Z" />
            
            <!-- Box Front Design -->
            <rect x="220" y="270" width="160" height="50" fill="#DC143C" transform="rotate(-15 220 270)" />
            <text x="240" y="295" font-family="sans-serif" font-size="24" font-weight="bold" fill="#FFF" transform="rotate(-15 240 295)">ANTIBIOTIC</text>
            <rect x="230" y="320" width="100" height="8" fill="#111" transform="rotate(-15 230 320)" />
            <rect x="230" y="340" width="80" height="8" fill="#111" transform="rotate(-15 230 340)" />
            
            <!-- Crushed side creases -->
            <path fill="none" stroke="#A9A9A9" stroke-width="4" d="M 220 180 Q 280 190 250 250" />
            <path fill="none" stroke="#A9A9A9" stroke-width="4" d="M 350 180 Q 300 210 380 230" />
        </g>
    )SVG";

    // 6. Syringe Cap
    items["syringe_cap.svg"] = R"SVG(
        <g transform="rotate(-40 256 256)">
            <!-- Orange Syringe Cap (Common for insulin) -->
            <path class="outline" fill="#FF8C00" d="M 200 150 L 300 150 L 280 350 L 220 350 Z" />
            <path class="highlight" d="M 210 160 L 290 160 L 275 340 L 225 340 Z" />
            
            <!-- Grip ridges -->
            <path fill="none" stroke="#D2691E" stroke-width="4" d="M 215 200 L 285 200 M 218 230 L 282 230 M 221 260 L 279 260 M 224 290 L 276 290 M 227 320 L 273 320" />
            
            <!-- Bottom opening -->
            <ellipse cx="250" cy="150" rx="50" ry="15" class="outline" fill="#CD5C5C" />
            <ellipse cx="250" cy="150" rx="40" ry="10" fill="#111111" /> <!-- Hollow inside -->
            
            <!-- Top closed end -->
            <ellipse cx="250" cy="350" rx="30" ry="8" class="outline" fill="#FF8C00" />
            
            <!-- Glare line -->
            <path fill="none" stroke="#FFF" stroke-width="6" stroke-linecap="round" d="M 230 180 L 240 330" opacity="0.6" />
        </g>
    )SVG";

    // 7. Cotton Swabs
    items["cotton_swabs.svg"] = R"SVG(
        <g transform="translate(0, 10)">
            <!-- Swab 1 -->
            <g transform="rotate(15 250 200)">
                <!-- Stick (Paper/Plastic) -->
                <rect x="245" y="100" width="10" height="200" class="outline" fill="#F0F8FF" />
                <rect x="250" y="100" width="3" height="200" fill="#87CEFA" opacity="0.5" />
                <!-- Top Cotton -->
                <ellipse cx="250" cy="90" rx="15" ry="25" class="outline" fill="#FFFFFF" />
                <!-- Bottom Cotton (Dirty) -->
                <ellipse cx="250" cy="310" rx="15" ry="25" class="outline" fill="#FFFFFF" />
                <ellipse cx="250" cy="310" rx="10" ry="18" fill="#FFD700" opacity="0.6" /> <!-- Earwax/Iodine -->
            </g>
            
            <!-- Swab 2 -->
            <g transform="translate(30, 60) rotate(-25 250 200)">
                <rect x="245" y="100" width="10" height="200" class="outline" fill="#F0F8FF" />
                <rect x="250" y="100" width="3" height="200" fill="#87CEFA" opacity="0.5" />
                <ellipse cx="250" cy="90" rx="15" ry="25" class="outline" fill="#FFFFFF" />
                <ellipse cx="250" cy="90" rx="12" ry="20" fill="#8B0000" opacity="0.5" /> <!-- Blood -->
                <ellipse cx="250" cy="310" rx="15" ry="25" class="outline" fill="#FFFFFF" />
            </g>
        </g>
    )SVG";

    // 8. Pill Blister Pack
    items["pill_blister_pack.svg"] = R"SVG(
        <g transform="rotate(5 256 256)">
            <!-- Foil Backing (Silver) -->
            <rect x="150" y="150" width="200" height="150" rx="10" class="outline" fill="#C0C0C0" />
            
            <!-- Plastic Bubbles (6 slots) -->
            <!-- Slot 1 (Full) -->
            <circle cx="190" cy="190" r="20" class="outline" fill="#FFFFFF" />
            <circle cx="190" cy="190" r="15" fill="#32CD32" /> <!-- Green Pill -->
            <circle cx="185" cy="185" r="5" fill="#FFF" opacity="0.6" /> <!-- Glare -->
            
            <!-- Slot 2 (Empty/Popped) -->
            <circle cx="250" cy="190" r="20" fill="none" stroke="#111" stroke-width="4" stroke-dasharray="5 5" />
            <path class="outline" fill="#A9A9A9" d="M 240 190 L 250 180 L 260 190 L 250 200 Z" /> <!-- Torn foil hole -->
            
            <!-- Slot 3 (Full) -->
            <circle cx="310" cy="190" r="20" class="outline" fill="#FFFFFF" />
            <circle cx="310" cy="190" r="15" fill="#32CD32" />
            <circle cx="305" cy="185" r="5" fill="#FFF" opacity="0.6" />
            
            <!-- Slot 4 (Empty/Popped) -->
            <circle cx="190" cy="250" r="20" fill="none" stroke="#111" stroke-width="4" stroke-dasharray="5 5" />
            <path class="outline" fill="#A9A9A9" d="M 180 250 L 190 240 L 200 250 L 190 260 Z" />
            
            <!-- Slot 5 (Empty/Popped) -->
            <circle cx="250" cy="250" r="20" fill="none" stroke="#111" stroke-width="4" stroke-dasharray="5 5" />
            <path class="outline" fill="#A9A9A9" d="M 240 250 L 250 240 L 260 250 L 250 260 Z" />
            
            <!-- Slot 6 (Full) -->
            <circle cx="310" cy="250" r="20" class="outline" fill="#FFFFFF" />
            <circle cx="310" cy="250" r="15" fill="#32CD32" />
            <circle cx="305" cy="245" r="5" fill="#FFF" opacity="0.6" />
            
            <!-- Crinkles in the foil -->
            <path fill="none" stroke="#A9A9A9" stroke-width="3" d="M 160 220 L 340 220 M 220 160 L 220 290 M 280 160 L 280 290" opacity="0.5" />
        </g>
    )SVG";

    // 9. Used Tissue Box
    items["used_tissue_box.svg"] = R"SVG(
        <g transform="rotate(-15 256 256)">
            <!-- Box Front -->
            <path class="outline" fill="#ADD8E6" d="M 120 200 L 320 180 L 320 320 L 120 350 Z" />
            <!-- Box Top -->
            <path class="outline" fill="#87CEEB" d="M 120 200 L 220 100 L 420 80 L 320 180 Z" />
            <!-- Box Side -->
            <path class="outline" fill="#4682B4" d="M 320 180 L 420 80 L 420 220 L 320 320 Z" />
            
            <!-- Floral Pattern on Box -->
            <circle cx="180" cy="250" r="20" fill="#FFF" opacity="0.4" />
            <circle cx="250" cy="280" r="30" fill="#FFF" opacity="0.4" />
            <circle cx="150" cy="300" r="15" fill="#FFF" opacity="0.4" />
            
            <!-- Tissue Hole (Oval) -->
            <ellipse cx="270" cy="140" rx="60" ry="20" fill="#111" transform="rotate(-10 270 140)" />
            
            <!-- Tissues sticking out / overflowing -->
            <path class="outline" fill="#FFFFFF" d="M 230 140 Q 150 50 280 30 Q 380 50 320 140 Z" />
            <path class="highlight" d="M 250 130 Q 200 80 280 60 Q 340 80 300 130 Z" />
            <path fill="none" stroke="#D3D3D3" stroke-width="4" d="M 240 100 Q 270 80 300 100" />
            
            <!-- Crumpled tissues on the floor -->
            <path class="outline" fill="#F8F8FF" d="M 50 350 Q 80 300 120 320 Q 150 350 100 400 Z" />
            <path class="outline" fill="#F8F8FF" d="M 350 350 Q 400 300 450 350 Q 480 400 380 400 Z" />
            
            <!-- Box Crushed corner -->
            <path fill="none" stroke="#111" stroke-width="6" d="M 120 350 L 140 310 L 150 340" />
        </g>
    )SVG";

    // 10. Empty Pill Bottle
    items["empty_pill_bottle.svg"] = R"SVG(
        <g transform="rotate(20 256 256)">
            <!-- Bottle Body (Orange translucent plastic) -->
            <path class="outline" fill="#FF8C00" d="M 180 180 L 340 180 L 320 400 A 70 20 0 0 1 200 400 Z" opacity="0.8" />
            <path class="highlight" d="M 190 190 L 220 190 L 210 400 L 190 400 Z" opacity="0.5" />
            
            <!-- White Label -->
            <path class="outline" fill="#FFFFFF" d="M 175 220 L 345 220 L 335 340 L 185 340 Z" />
            <rect x="200" y="240" width="120" height="10" fill="#111" />
            <rect x="200" y="260" width="100" height="10" fill="#111" />
            <rect x="200" y="280" width="130" height="10" fill="#111" />
            
            <rect x="200" y="310" width="60" height="20" fill="#DC143C" /> <!-- Warning label -->
            <text x="210" y="325" font-family="sans-serif" font-size="12" font-weight="bold" fill="#FFF">WARNING</text>
            
            <!-- Cap (White, Childproof style) -->
            <rect x="160" y="130" width="200" height="50" rx="10" class="outline" fill="#F8F8FF" />
            <!-- Cap ridges -->
            <path fill="none" stroke="#D3D3D3" stroke-width="4" d="M 180 135 L 180 175 M 200 135 L 200 175 M 220 135 L 220 175 M 240 135 L 240 175 M 260 135 L 260 175 M 280 135 L 280 175 M 300 135 L 300 175 M 320 135 L 320 175 M 340 135 L 340 175" />
            
            <!-- Lone leftover pill outside -->
            <circle cx="100" cy="380" r="15" class="outline" fill="#FFFFFF" />
            <path fill="none" stroke="#D3D3D3" stroke-width="2" d="M 85 380 L 115 380" />
            <circle cx="140" cy="400" r="15" class="outline" fill="#FFFFFF" />
            <path fill="none" stroke="#D3D3D3" stroke-width="2" d="M 125 400 L 155 400" />
        </g>
    )SVG";

    std::cout << "Starting generation of HIGH DETAIL NYC Hospital SVG trash items..." << std::endl;
    for (const auto& pair : items) {
        writeSVG(pair.first, pair.second);
    }
    std::cout << "All SVGs generated successfully!" << std::endl;

    return 0;
}
