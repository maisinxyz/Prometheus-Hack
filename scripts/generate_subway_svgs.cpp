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

    // 1. Metro Card
    items["metro_card.svg"] = R"SVG(
        <g transform="rotate(-10 256 256)">
            <!-- Card Body -->
            <path class="outline" fill="#FFC107" d="M 100 150 L 400 150 L 400 350 L 100 350 Z" />
            <path class="highlight" d="M 110 160 L 390 160 L 390 200 L 110 200 Z" />
            
            <!-- Magnetic Stripe -->
            <rect x="100" y="180" width="300" height="40" fill="#111111" />
            
            <!-- Text & Design -->
            <text x="120" y="270" font-family="sans-serif" font-size="36" font-weight="bold" fill="#0033A0">MetroCard</text>
            <rect x="120" y="285" width="200" height="8" fill="#D32F2F" />
            
            <!-- Arrows -->
            <path fill="#111111" d="M 320 280 L 350 280 L 350 270 L 370 290 L 350 310 L 350 300 L 320 300 Z" />
            
            <!-- Scuff marks and dirt -->
            <path fill="none" stroke="#B8860B" stroke-width="4" d="M 150 320 L 250 330 M 130 160 L 200 170" opacity="0.6"/>
            <circle cx="280" cy="300" r="15" fill="#111" opacity="0.1" />
            
            <!-- Cut corner -->
            <path class="outline" fill="#FFC107" d="M 100 150 L 130 150 L 100 180 Z" />
            <path fill="#2a2a2a" d="M 96 146 L 134 146 L 96 184 Z" /> <!-- Hide the corner -->
            <!-- Real shape overlay for cut corner -->
            <path class="outline" fill="#FFC107" d="M 130 150 L 400 150 L 400 350 L 100 350 L 100 180 Z" />
            <rect x="100" y="180" width="300" height="40" fill="#111111" />
            <text x="120" y="270" font-family="sans-serif" font-size="36" font-weight="bold" fill="#0033A0">MetroCard</text>
            <rect x="120" y="285" width="200" height="8" fill="#D32F2F" />
            <path fill="#111111" d="M 320 280 L 350 280 L 350 270 L 370 290 L 350 310 L 350 300 L 320 300 Z" />
            <path class="shadow" d="M 130 150 L 150 150 L 150 350 L 100 350 L 100 180 Z" />
        </g>
    )SVG";

    // 2. Newspaper
    items["newspaper.svg"] = R"SVG(
        <g transform="rotate(5 256 256)">
            <!-- Base folded paper -->
            <path class="outline" fill="#F5F5DC" d="M 80 120 L 380 100 L 420 380 L 120 400 Z" />
            <path fill="#FAFAD2" d="M 90 130 L 370 110 L 410 370 L 130 390 Z" />
            
            <!-- Headline -->
            <rect x="110" y="150" width="240" height="40" fill="#111" transform="rotate(-4 110 150)" />
            <text x="120" y="180" font-family="serif" font-size="28" font-weight="bold" fill="#FFF" transform="rotate(-4 120 180)">DAILY BUGLE</text>
            
            <!-- Columns of text -->
            <path fill="none" stroke="#555" stroke-width="4" stroke-dasharray="8 4" d="M 115 220 L 220 215 M 115 240 L 220 235 M 115 260 L 220 255 M 115 280 L 220 275 M 115 300 L 220 295 M 115 320 L 220 315" />
            <path fill="none" stroke="#555" stroke-width="4" stroke-dasharray="10 5" d="M 240 210 L 360 205 M 240 230 L 360 225 M 240 250 L 360 245 M 240 270 L 360 265 M 240 290 L 360 285 M 240 310 L 360 305" />
            
            <!-- Image box -->
            <rect x="250" y="330" width="120" height="50" fill="#B0C4DE" transform="rotate(-4 250 330)" />
            
            <!-- Coffee Ring Stain -->
            <ellipse cx="200" cy="340" rx="30" ry="20" fill="none" stroke="#8B4513" stroke-width="6" opacity="0.6" transform="rotate(20 200 340)" />
            
            <!-- Fold Crease -->
            <path class="shadow" d="M 230 115 L 250 115 L 280 380 L 260 380 Z" />
        </g>
    )SVG";

    // 3. Gum Wrapper
    items["gum_wrapper.svg"] = R"SVG(
        <g transform="rotate(25 256 256)">
            <!-- Foil Wrapper -->
            <path class="outline" fill="#C0C0C0" d="M 150 200 L 350 200 L 350 300 L 150 300 Z" />
            <path class="highlight" d="M 160 210 L 340 210 L 340 250 L 160 250 Z" />
            
            <!-- Zig-zag edges -->
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="miter" d="M 150 200 L 140 210 L 150 220 L 140 230 L 150 240 L 140 250 L 150 260 L 140 270 L 150 280 L 140 290 L 150 300" />
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="miter" d="M 350 200 L 360 210 L 350 220 L 360 230 L 350 240 L 360 250 L 350 260 L 360 270 L 350 280 L 360 290 L 350 300" />
            
            <!-- Brand Strip -->
            <rect x="200" y="200" width="100" height="100" fill="#32CD32" />
            <text x="210" y="260" font-family="sans-serif" font-size="28" font-weight="bold" fill="#FFF">MINT</text>
            
            <!-- Wrinkle Lines -->
            <path fill="none" stroke="#A9A9A9" stroke-width="4" d="M 170 200 L 180 300" />
            <path fill="none" stroke="#A9A9A9" stroke-width="4" d="M 320 200 L 310 300" />
            
            <!-- Bent Corner -->
            <path class="outline" fill="#D3D3D3" d="M 150 200 L 190 200 L 170 230 Z" />
        </g>
    )SVG";

    // 4. Chewed Gum
    items["chewed_gum.svg"] = R"SVG(
        <g transform="translate(0, 50)">
            <!-- Gooey shape base -->
            <path class="outline" fill="#FF69B4" d="M 200 200 Q 250 150 300 180 Q 350 160 380 220 Q 420 300 350 350 Q 250 400 180 350 Q 120 320 150 250 Q 130 180 200 200 Z" />
            <path class="highlight" d="M 210 210 Q 250 170 290 200 Q 320 190 350 230 Q 380 290 330 330 Z" />
            
            <!-- Stretched stringy bits -->
            <path class="outline" fill="#FF69B4" d="M 180 350 Q 150 450 100 480 Q 140 420 190 340" />
            
            <!-- Teeth marks / Indents -->
            <path class="shadow" d="M 250 220 Q 270 240 250 260 Q 230 240 250 220 Z" />
            <path class="shadow" d="M 300 240 Q 320 260 300 280 Q 280 260 300 240 Z" />
            <path class="shadow" d="M 220 280 Q 240 300 220 320 Q 200 300 220 280 Z" />
            
            <!-- Dirt Specs from Subway floor -->
            <circle cx="280" cy="300" r="4" fill="#555" />
            <circle cx="330" cy="250" r="3" fill="#555" />
            <circle cx="200" cy="330" r="5" fill="#555" />
            <circle cx="360" cy="310" r="3" fill="#555" />
            <circle cx="160" cy="270" r="4" fill="#555" />
        </g>
    )SVG";

    // 5. Pizza Box (Greasy)
    items["pizza_box_greasy.svg"] = R"SVG(
        <g transform="rotate(-15 256 256)">
            <!-- Box Bottom/Inside -->
            <path class="outline" fill="#DEB887" d="M 150 250 L 350 200 L 450 300 L 250 350 Z" />
            
            <!-- Grease Stain inside -->
            <ellipse cx="300" cy="280" rx="60" ry="30" fill="#8B4513" opacity="0.3" transform="rotate(-10 300 280)" />
            <ellipse cx="330" cy="260" rx="40" ry="20" fill="#8B4513" opacity="0.4" transform="rotate(20 330 260)" />
            
            <!-- Box Lid (Half Open) -->
            <path class="outline" fill="#F5DEB3" d="M 150 250 L 350 200 L 300 50 L 100 100 Z" />
            <path class="shadow" d="M 150 250 L 250 225 L 200 75 L 100 100 Z" />
            
            <!-- Box Logo on Lid -->
            <circle cx="225" cy="150" r="35" class="outline" fill="#DC143C" transform="rotate(15 225 150)" />
            <path fill="#FFF" d="M 205 145 L 245 145 L 225 125 Z" transform="rotate(15 225 150)" />
            <path fill="#FFF" d="M 205 155 L 245 155 L 225 175 Z" transform="rotate(15 225 150)" />
            
            <!-- Crumbs -->
            <circle cx="350" cy="300" r="5" fill="#FF8C00" />
            <circle cx="280" cy="320" r="4" fill="#FF8C00" />
            
            <!-- Front Flaps -->
            <path class="outline" fill="#CD853F" d="M 250 350 L 450 300 L 450 320 L 250 370 Z" />
            <path class="outline" fill="#CD853F" d="M 150 250 L 250 350 L 250 370 L 150 270 Z" />
        </g>
    )SVG";

    // 6. Cigarette Butt
    items["cigarette_butt.svg"] = R"SVG(
        <g transform="rotate(35 256 256) translate(0, 150)">
            <!-- Ash / Cherry end -->
            <path class="outline" fill="#696969" d="M 130 140 Q 110 150 130 160 L 160 160 L 160 140 Z" />
            <circle cx="120" cy="150" r="8" fill="#A9A9A9" />
            <circle cx="125" cy="145" r="5" fill="#DC143C" opacity="0.8" /> <!-- Cherry -->
            
            <!-- Main Paper Body -->
            <path class="outline" fill="#FFFFFF" d="M 160 140 L 300 140 L 300 160 L 160 160 Z" />
            <path class="shadow" d="M 160 150 L 300 150 L 300 160 L 160 160 Z" />
            
            <!-- Orange Filter -->
            <path class="outline" fill="#FF8C00" d="M 300 140 L 380 140 L 380 160 L 300 160 Z" />
            
            <!-- Filter Texture -->
            <path fill="none" stroke="#D2691E" stroke-width="2" stroke-dasharray="2 2" d="M 320 140 L 320 160 M 340 140 L 340 160 M 360 140 L 360 160" />
            <path class="shadow" d="M 300 150 L 380 150 L 380 160 L 300 160 Z" />
            
            <!-- Burn Mark on Paper -->
            <path fill="#8B4513" d="M 160 140 Q 180 150 160 160 L 165 160 Q 185 150 165 140 Z" />
            
            <!-- Bent/Crushed Filter End -->
            <path class="outline" fill="#FF8C00" d="M 380 140 Q 400 130 390 150 Q 400 170 380 160 Z" />
        </g>
    )SVG";

    // 7. Glass Bottle
    items["glass_bottle.svg"] = R"SVG(
        <g transform="rotate(-10 256 256)">
            <!-- Glass Body -->
            <path class="outline" fill="#2E8B57" d="M 210 150 L 290 150 L 320 220 L 320 420 Q 320 450 250 450 Q 180 450 180 420 L 180 220 Z" opacity="0.8" />
            <path class="highlight" d="M 220 160 L 250 160 L 260 220 L 260 420 L 220 420 L 220 220 Z" opacity="0.6" />
            
            <!-- Label -->
            <path class="outline" fill="#FFFFFF" d="M 180 270 L 320 270 L 320 350 L 180 350 Z" />
            <path fill="#DC143C" d="M 180 280 L 320 280 L 320 340 L 180 340 Z" />
            <!-- Star logo -->
            <polygon points="250,290 260,310 280,310 265,325 270,345 250,335 230,345 235,325 220,310 240,310" fill="#FFF" />
            
            <!-- Cap (Silver/Grey) -->
            <rect x="205" y="130" width="90" height="20" rx="5" class="outline" fill="#C0C0C0" />
            <!-- Cap ridges -->
            <path fill="none" stroke="#111" stroke-width="2" d="M 215 130 L 215 150 M 235 130 L 235 150 M 255 130 L 255 150 M 275 130 L 275 150" />
            
            <!-- Liquid inside -->
            <path fill="#006400" d="M 185 360 L 315 360 L 315 420 Q 315 440 250 440 Q 185 440 185 420 Z" opacity="0.7" />
            
            <path class="shadow" d="M 180 220 L 220 220 L 220 420 Q 220 440 180 420 Z" opacity="0.5" />
        </g>
    )SVG";

    // 8. Chip Bag
    items["chip_bag.svg"] = R"SVG(
        <g transform="rotate(15 256 256)">
            <!-- Foil Bag Body (Red) -->
            <path class="outline" fill="#DC143C" d="M 140 100 L 360 120 L 380 400 L 120 380 Z" />
            
            <!-- Top / Bottom Zigzag Seals -->
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="miter" d="M 140 100 L 150 90 L 160 100 L 170 90 L 180 100 L 190 90 L 200 100 L 210 90 L 220 100 L 230 90 L 240 100 L 250 90 L 260 100 L 270 90 L 280 100 L 290 90 L 300 100 L 310 90 L 320 100 L 330 90 L 340 100 L 350 90 L 360 120" />
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="miter" d="M 120 380 L 130 390 L 140 380 L 150 390 L 160 380 L 170 390 L 180 380 L 190 390 L 200 380 L 210 390 L 220 380 L 230 390 L 240 380 L 250 390 L 260 380 L 270 390 L 280 380 L 290 390 L 300 380 L 310 390 L 320 380 L 330 390 L 340 380 L 350 390 L 360 380 L 370 390 L 380 400" />
            
            <!-- Brand Logo (Yellow Circle) -->
            <circle cx="250" cy="240" r="60" fill="#FFD700" />
            <path class="outline" fill="#FFFFFF" d="M 200 230 L 300 230 L 290 260 L 210 260 Z" />
            <text x="250" y="255" font-family="sans-serif" font-size="28" font-weight="bold" fill="#DC143C" text-anchor="middle">CRISPS</text>
            
            <!-- Wrinkles -->
            <path fill="none" stroke="#B22222" stroke-width="6" d="M 140 180 Q 200 200 160 250" />
            <path fill="none" stroke="#B22222" stroke-width="6" d="M 360 280 Q 300 300 350 350" />
            
            <!-- Inner Foil Exposed from a tear -->
            <path class="outline" fill="#C0C0C0" d="M 320 115 L 360 120 L 350 180 Q 300 150 320 115 Z" />
            <path class="highlight" d="M 330 125 L 350 130 L 340 160 Q 310 140 330 125 Z" />
            
            <path class="highlight" d="M 150 120 Q 180 250 130 370 L 150 370 Q 200 250 170 120 Z" />
        </g>
    )SVG";

    // 9. Crumpled Newspaper
    items["crumpled_newspaper.svg"] = R"SVG(
        <g>
            <!-- Ball Base -->
            <path class="outline" fill="#F5F5DC" d="M 150 200 Q 180 120 280 150 Q 380 120 400 220 Q 420 320 350 380 Q 250 420 180 380 Q 120 350 150 200 Z" />
            
            <!-- Layers and folds inside the ball -->
            <path class="outline" fill="#FAFAD2" d="M 180 180 Q 250 220 280 150" />
            <path class="outline" fill="#FAFAD2" d="M 380 250 Q 300 300 350 380" />
            <path class="outline" fill="#FAFAD2" d="M 150 280 Q 200 350 250 320 Q 300 250 220 220" />
            
            <!-- Dark crevices (shadows) -->
            <path fill="#D3D3D3" d="M 220 220 Q 250 250 250 320 Q 220 280 220 220 Z" />
            <path fill="#D3D3D3" d="M 280 150 Q 300 200 350 200 Q 320 180 280 150 Z" />
            
            <!-- Text scribbles (curved with the folds) -->
            <path fill="none" stroke="#333" stroke-width="4" stroke-dasharray="5 3" d="M 160 220 Q 190 210 200 250" />
            <path fill="none" stroke="#333" stroke-width="4" stroke-dasharray="6 4" d="M 280 320 Q 310 340 330 300" />
            <path fill="none" stroke="#333" stroke-width="5" stroke-dasharray="8 4" d="M 320 170 Q 350 180 370 230" />
            
            <!-- Title snippet -->
            <text x="210" y="280" font-family="serif" font-size="24" font-weight="bold" fill="#111" transform="rotate(-15 210 280)">NEWS</text>
        </g>
    )SVG";

    // 10. Discarded Face Mask
    items["discarded_face_mask.svg"] = R"SVG(
        <g transform="rotate(-5 256 256)">
            <!-- Ear loops (White string) -->
            <path class="outline" fill="none" stroke="#FFFFFF" stroke-width="10" d="M 150 200 Q 50 250 150 350" />
            <path class="outline" fill="none" stroke="#FFFFFF" stroke-width="10" d="M 350 180 Q 450 220 350 320" />
            
            <!-- Main Mask Body (Light Blue) -->
            <path class="outline" fill="#ADD8E6" d="M 150 200 Q 250 150 350 180 L 350 320 Q 250 380 150 350 Z" />
            
            <!-- Pleats (Folds) -->
            <path class="outline" fill="none" stroke="#87CEFA" stroke-width="8" d="M 145 250 Q 250 200 345 230" />
            <path class="outline" fill="none" stroke="#87CEFA" stroke-width="8" d="M 145 300 Q 250 250 345 280" />
            
            <path class="highlight" d="M 150 200 Q 250 150 350 180 L 350 230 Q 250 200 150 250 Z" />
            <path class="shadow" d="M 150 300 Q 250 250 350 280 L 350 320 Q 250 380 150 350 Z" />
            
            <!-- Nose wire clip -->
            <path fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" d="M 210 175 Q 250 160 290 170" />
            
            <!-- Dirt smudge -->
            <ellipse cx="250" cy="270" rx="30" ry="15" fill="#808080" opacity="0.4" />
        </g>
    )SVG";

    std::cout << "Starting generation of HIGH DETAIL Subway Station SVG trash items..." << std::endl;
    for (const auto& pair : items) {
        writeSVG(pair.first, pair.second);
    }
    std::cout << "All SVGs generated successfully!" << std::endl;

    return 0;
}
