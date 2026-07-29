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

    // 1. Fanta Can
    items["soda_fanta_empty.svg"] = R"SVG(
        <g transform="rotate(15 256 256)">
            <!-- Can Body -->
            <path class="outline" fill="#FF8C00" d="M 160 120 L 340 120 Q 320 250 360 260 Q 320 400 340 400 L 160 400 Q 180 250 140 240 Q 180 150 160 120 Z" />
            
            <!-- Rims -->
            <ellipse cx="250" cy="120" rx="90" ry="15" class="outline" fill="#C0C0C0" />
            <ellipse cx="250" cy="400" rx="90" ry="15" class="outline" fill="#C0C0C0" />
            
            <!-- Brand Element (Leaf and white swoosh) -->
            <path fill="#32CD32" d="M 190 200 Q 220 180 240 210 Q 210 230 190 200 Z" />
            <path fill="#FFFFFF" d="M 230 180 Q 280 180 320 230 Q 270 260 210 240 Z" />
            
            <!-- Crushed lines -->
            <path fill="none" stroke="#D2691E" stroke-width="6" d="M 160 240 L 250 250 L 360 260" />
        </g>
    )SVG";

    // 2. Pepsi Can
    items["soda_pepsi_empty.svg"] = R"SVG(
        <g transform="rotate(-15 256 256)">
            <!-- Can Body -->
            <path class="outline" fill="#1E90FF" d="M 160 120 L 340 120 Q 350 250 330 260 Q 350 400 340 400 L 160 400 Q 150 250 170 240 Q 150 150 160 120 Z" />
            
            <!-- Rims -->
            <ellipse cx="250" cy="120" rx="90" ry="15" class="outline" fill="#C0C0C0" />
            <ellipse cx="250" cy="400" rx="90" ry="15" class="outline" fill="#C0C0C0" />
            
            <!-- Brand Element (Red/White/Blue circle) -->
            <ellipse cx="250" cy="250" rx="40" ry="30" fill="#FFFFFF" />
            <path fill="#DC143C" d="M 210 250 A 40 30 0 0 1 290 250 Q 250 270 210 250 Z" />
            <path fill="#0000CD" d="M 210 250 A 40 30 0 0 0 290 250 Q 250 230 210 250 Z" />
            
            <!-- Crushed lines -->
            <path fill="none" stroke="#000080" stroke-width="6" d="M 170 240 L 250 250 L 330 260" />
        </g>
    )SVG";

    // 3. Foodbox
    items["foodbox_empty.svg"] = R"SVG(
        <g transform="rotate(5 256 256)">
            <!-- Takeout Box Base -->
            <path class="outline" fill="#FFFFFF" d="M 150 220 L 350 220 L 320 400 L 180 400 Z" />
            
            <!-- Flaps (Open) -->
            <path class="outline" fill="#F8F8FF" d="M 150 220 L 80 120 L 250 150 Z" />
            <path class="outline" fill="#F8F8FF" d="M 350 220 L 420 120 L 250 150 Z" />
            
            <!-- Grease spots -->
            <ellipse cx="250" cy="350" rx="30" ry="15" fill="#FF8C00" opacity="0.3" />
            <ellipse cx="200" cy="280" rx="20" ry="10" fill="#FF8C00" opacity="0.2" transform="rotate(-15 200 280)" />
            
            <!-- Metal Handle wire -->
            <path class="outline" fill="none" stroke-width="4" d="M 160 250 Q 100 150 250 100 Q 400 150 340 250" />
            
            <path class="shadow" d="M 180 400 L 320 400 L 350 450 L 150 450 Z" opacity="0.2" />
        </g>
    )SVG";

    // 4. Half Eaten Hot Dog
    items["half_eaten_hot_dog.svg"] = R"SVG(
        <g transform="rotate(-20 256 256)">
            <!-- Bun Base -->
            <path class="outline" fill="#F5DEB3" d="M 120 200 Q 150 250 300 250 Q 320 250 340 220 Q 250 180 150 150 Q 110 150 120 200 Z" />
            
            <!-- Weiner -->
            <path class="outline" fill="#CD5C5C" d="M 130 180 Q 250 180 320 200 Q 340 180 320 160 Q 250 140 130 140 A 20 20 0 0 0 130 180 Z" />
            
            <!-- Mustard Zigzag -->
            <path fill="none" stroke="#FFD700" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" d="M 150 160 L 170 170 L 190 150 L 210 170 L 230 150 L 250 170 L 270 150 L 290 170" />
            
            <!-- Top Bun Flap -->
            <path class="outline" fill="#DEB887" d="M 120 130 Q 150 100 300 130 Q 320 140 340 170 Q 250 130 150 130 Q 110 130 120 130 Z" opacity="0.9" />
            
            <!-- Huge Bite Mark on right side -->
            <path class="outline" fill="#FFFFFF" d="M 300 120 Q 280 170 300 210 Q 260 230 300 270 Q 350 250 350 180 Z" opacity="0.0" />
            <path fill="none" stroke="#1a1a1a" stroke-width="8" stroke-dasharray="10 5" d="M 300 120 Q 280 170 300 210 Q 260 230 300 270" />
        </g>
    )SVG";

    // 5. Hot Dog Bun Scraps
    items["hot_dog_bun_scraps.svg"] = R"SVG(
        <g transform="translate(0, 30)">
            <!-- Torn Bun Piece 1 -->
            <path class="outline" fill="#F5DEB3" d="M 150 200 Q 180 180 200 220 Q 250 250 220 300 Q 150 320 120 280 Q 100 220 150 200 Z" />
            <path class="outline" fill="#DEB887" d="M 150 200 Q 180 180 200 220 Q 180 250 120 280 Q 100 220 150 200 Z" /> <!-- Crust -->
            
            <!-- Torn Bun Piece 2 (Smaller) -->
            <path class="outline" fill="#F5DEB3" d="M 300 300 Q 350 280 380 320 Q 350 380 300 350 Q 280 320 300 300 Z" />
            
            <!-- Crumbs -->
            <circle cx="280" cy="250" r="10" fill="#F5DEB3" class="outline" />
            <circle cx="240" cy="350" r="8" fill="#F5DEB3" class="outline" />
            <circle cx="380" cy="250" r="5" fill="#DEB887" class="outline" />
            <circle cx="180" cy="380" r="6" fill="#F5DEB3" class="outline" />
            <circle cx="120" cy="360" r="4" fill="#DEB887" class="outline" />
        </g>
    )SVG";

    // 6. Used Mustard Packet
    items["used_mustard_packet.svg"] = R"SVG(
        <g transform="rotate(-30 256 256)">
            <!-- Flat packet body -->
            <path class="outline" fill="#FFD700" d="M 180 150 L 320 150 L 320 350 L 180 350 Z" />
            <path class="shadow" d="M 180 160 L 320 160 L 320 350 L 180 350 Z" opacity="0.3" />
            
            <!-- Zigzag edges -->
            <path fill="none" stroke="#111" stroke-width="4" stroke-linejoin="miter" d="M 180 150 L 190 145 L 200 150 L 210 145 L 220 150 L 230 145 L 240 150 L 250 145 L 260 150 L 270 145 L 280 150 L 290 145 L 300 150 L 310 145 L 320 150" />
            <path fill="none" stroke="#111" stroke-width="4" stroke-linejoin="miter" d="M 180 350 L 190 355 L 200 350 L 210 355 L 220 350 L 230 355 L 240 350 L 250 355 L 260 350 L 270 355 L 280 350 L 290 355 L 300 350 L 310 355 L 320 350" />
            
            <!-- Text / Brand -->
            <rect x="200" y="200" width="100" height="40" fill="#DC143C" transform="rotate(10 200 200)" />
            <text x="210" y="225" font-family="sans-serif" font-size="16" font-weight="bold" fill="#FFF" transform="rotate(10 210 225)">MUSTARD</text>
            
            <!-- Squeezed / Crinkled lines -->
            <path fill="none" stroke="#DAA520" stroke-width="4" d="M 180 250 Q 250 230 320 260" />
            <path fill="none" stroke="#DAA520" stroke-width="4" d="M 180 300 Q 250 280 320 310" />
            
            <!-- Torn Corner -->
            <path class="outline" fill="#FFD700" d="M 320 150 L 280 150 L 320 190 Z" opacity="0.0" />
            <path fill="none" stroke="#111" stroke-width="8" stroke-dasharray="10 5" d="M 280 150 L 320 190" />
            <path fill="#FFF" d="M 280 150 L 320 150 L 320 190 Z" /> <!-- Make corner look missing -->
            
            <!-- Mustard Spill -->
            <path fill="#FFD700" d="M 310 180 Q 360 160 380 200 Q 390 250 350 230 Q 330 200 310 180 Z" opacity="0.9" />
        </g>
    )SVG";

    std::cout << "Starting generation of HIGH DETAIL Hot Dog & Cafe SVG trash items..." << std::endl;
    for (const auto& pair : items) {
        writeSVG(pair.first, pair.second);
    }
    std::cout << "All SVGs generated successfully!" << std::endl;

    return 0;
}
