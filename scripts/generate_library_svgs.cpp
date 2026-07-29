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

    // 1. Overdue Notice
    items["overdue_notice.svg"] = R"SVG(
        <g transform="rotate(5 256 256)">
            <!-- Pink Notice Paper -->
            <path class="outline" fill="#FFB6C1" d="M 120 100 L 380 100 L 400 400 L 140 400 Z" />
            <path class="highlight" d="M 130 110 L 370 110 L 380 390 L 150 390 Z" />
            
            <!-- Red urgent text -->
            <rect x="150" y="130" width="220" height="40" fill="#DC143C" transform="rotate(-2 150 130)" />
            <text x="160" y="160" font-family="sans-serif" font-size="28" font-weight="bold" fill="#FFF" transform="rotate(-2 160 160)">FINAL NOTICE</text>
            
            <!-- Typewriter lines -->
            <path fill="none" stroke="#333" stroke-width="4" stroke-linecap="round" d="M 150 200 L 350 205 M 150 230 L 320 235 M 155 260 L 360 265 M 155 290 L 250 295" />
            
            <!-- Amount Due -->
            <text x="160" y="340" font-family="monospace" font-size="24" font-weight="bold" fill="#B22222">$ 45.50 DUE</text>
            
            <!-- Official Stamp -->
            <circle cx="340" cy="330" r="30" fill="none" stroke="#DC143C" stroke-width="4" opacity="0.8" />
            <text x="315" y="335" font-family="sans-serif" font-size="16" font-weight="bold" fill="#DC143C" opacity="0.8">LIBRARY</text>
            
            <!-- Crease -->
            <path fill="none" stroke="#FF69B4" stroke-width="2" d="M 125 250 L 390 250" opacity="0.5" />
        </g>
    )SVG";

    // 2. Laminated Bookmark
    items["laminated_bookmark.svg"] = R"SVG(
        <g transform="rotate(-15 256 256)">
            <!-- Lamination Edge (Clear/Light Blue) -->
            <rect x="200" y="80" width="80" height="300" rx="5" class="outline" fill="#E0FFFF" opacity="0.7" />
            
            <!-- Paper Bookmark Inside -->
            <rect x="210" y="90" width="60" height="280" fill="#FFFACD" />
            
            <!-- Tassel Hole -->
            <circle cx="240" cy="105" r="5" fill="#111" />
            
            <!-- Tassel String -->
            <path class="outline" fill="none" stroke="#FF4500" stroke-width="4" d="M 240 100 Q 230 50 200 40 T 150 60" />
            
            <!-- Bookmark Art (Geometric design) -->
            <polygon points="210,150 270,180 270,220 210,250" fill="#20B2AA" />
            <polygon points="210,250 270,220 270,280 210,310" fill="#FFA500" />
            <circle cx="240" cy="200" r="15" fill="#FFD700" />
            
            <!-- Lamination Glare -->
            <path fill="#FFF" opacity="0.6" d="M 205 85 L 225 85 L 225 375 L 205 375 Z" />
            <path fill="#FFF" opacity="0.4" d="M 260 85 L 275 85 L 275 375 L 260 375 Z" />
        </g>
    )SVG";

    // 3. Used Teabag
    items["used_teabag.svg"] = R"SVG(
        <g>
            <!-- String -->
            <path class="outline" fill="none" stroke="#F5DEB3" stroke-width="4" d="M 250 180 Q 200 100 150 120 T 100 80" />
            
            <!-- Teabag Tag -->
            <rect x="80" y="60" width="30" height="40" class="outline" fill="#F0F8FF" transform="rotate(-20 95 80)" />
            <rect x="85" y="65" width="20" height="15" fill="#32CD32" transform="rotate(-20 95 80)" /> <!-- Green Brand -->
            
            <!-- Used Teabag Body (Soggy, irregular shape) -->
            <path class="outline" fill="#D2B48C" d="M 200 180 L 300 180 Q 320 250 330 350 Q 250 380 170 350 Q 180 250 200 180 Z" />
            
            <!-- Wet tea leaves inside -->
            <path fill="#8B4513" d="M 210 200 L 290 200 Q 310 250 320 340 Q 250 360 180 340 Q 190 250 210 200 Z" opacity="0.8" />
            
            <!-- Tea stain pool -->
            <ellipse cx="250" cy="380" rx="80" ry="30" fill="#8B4513" opacity="0.4" />
            
            <!-- Soggy paper texture / folds -->
            <path fill="none" stroke="#111" stroke-width="2" d="M 250 180 L 250 340" opacity="0.3" />
            <path fill="none" stroke="#111" stroke-width="2" d="M 220 250 Q 250 280 280 260" opacity="0.3" />
        </g>
    )SVG";

    // 4. Broken Reading Glasses
    items["broken_reading_glasses.svg"] = R"SVG(
        <g transform="rotate(10 256 256)">
            <!-- Left Frame and Lens -->
            <path class="outline" fill="none" stroke="#2F4F4F" stroke-width="12" d="M 150 200 Q 150 150 200 150 Q 250 150 250 200 Q 250 250 200 250 Q 150 250 150 200 Z" />
            <path fill="#E0FFFF" opacity="0.4" d="M 160 200 Q 160 160 200 160 Q 240 160 240 200 Q 240 240 200 240 Q 160 240 160 200 Z" />
            
            <!-- Bridge (Snapped) -->
            <path class="outline" fill="none" stroke="#2F4F4F" stroke-width="12" d="M 250 180 Q 275 160 280 180" />
            
            <!-- Right Frame (Bent and broken off) -->
            <g transform="translate(60, 40) rotate(30 300 200)">
                <path class="outline" fill="none" stroke="#2F4F4F" stroke-width="12" d="M 300 200 Q 300 150 350 150 Q 400 150 400 200 Q 400 250 350 250 Q 300 250 300 200 Z" />
                <!-- Cracked Lens -->
                <path fill="#E0FFFF" opacity="0.4" d="M 310 200 Q 310 160 350 160 Q 390 160 390 200 Q 390 240 350 240 Q 310 240 310 200 Z" />
                <path class="outline" fill="none" stroke="#111" stroke-width="2" d="M 320 170 L 350 200 L 390 180" />
                <path class="outline" fill="none" stroke="#111" stroke-width="2" d="M 350 200 L 340 240" />
                <!-- Remaining broken bridge piece -->
                <path class="outline" fill="none" stroke="#2F4F4F" stroke-width="12" d="M 300 180 Q 280 160 270 170" />
            </g>
            
            <!-- Arm pieces -->
            <path class="outline" fill="none" stroke="#111111" stroke-width="10" d="M 150 200 L 80 120" />
            <path class="outline" fill="none" stroke="#111111" stroke-width="10" d="M 400 250 L 460 320" />
        </g>
    )SVG";

    // 5. Chewed Pencil
    items["chewed_pencil.svg"] = R"SVG(
        <g transform="rotate(-30 256 256)">
            <!-- Pencil Body -->
            <polygon class="outline" points="150,220 350,220 350,260 150,260" fill="#FFD700" />
            <path class="highlight" d="M 150,225 L 350,225 L 350,235 L 150,235 Z" />
            
            <!-- Lead Point -->
            <polygon class="outline" points="350,220 400,240 350,260" fill="#F5DEB3" />
            <polygon points="380,232 400,240 380,248" fill="#111111" />
            
            <!-- Metal Ferrule -->
            <rect x="110" y="220" width="40" height="40" class="outline" fill="#C0C0C0" />
            <rect x="120" y="220" width="5" height="40" fill="#111" opacity="0.3" />
            <rect x="135" y="220" width="5" height="40" fill="#111" opacity="0.3" />
            
            <!-- Eraser (Chewed down) -->
            <path class="outline" fill="#FF69B4" d="M 110 220 L 90 225 Q 80 240 90 255 L 110 260 Z" />
            
            <!-- Chewed Wood End (Teeth Marks) -->
            <path class="outline" fill="#F5DEB3" d="M 150 220 L 160 230 L 140 240 L 160 250 L 150 260 L 200 260 L 200 220 Z" />
            <path fill="none" stroke="#D2B48C" stroke-width="2" d="M 160 230 L 180 230 M 150 240 L 170 240" />
            
            <!-- Bite Marks in the Yellow Paint -->
            <ellipse cx="170" cy="225" rx="8" ry="4" fill="#F5DEB3" />
            <ellipse cx="190" cy="225" rx="6" ry="3" fill="#F5DEB3" />
            <ellipse cx="180" cy="255" rx="10" ry="4" fill="#F5DEB3" />
            <ellipse cx="220" cy="255" rx="6" ry="3" fill="#F5DEB3" />
        </g>
    )SVG";

    // 6. CD Jewel Case
    items["cd_jewel_case.svg"] = R"SVG(
        <g transform="rotate(15 256 256)">
            <!-- Base Plastic Case -->
            <rect x="120" y="120" width="260" height="230" class="outline" fill="#D3D3D3" opacity="0.8" />
            <path class="highlight" d="M 130 130 L 370 130 L 370 160 L 130 160 Z" opacity="0.5" />
            
            <!-- Black Spine/Tray -->
            <rect x="120" y="120" width="30" height="230" fill="#1a1a1a" />
            
            <!-- CD Paper Insert -->
            <rect x="160" y="130" width="210" height="210" fill="#F8F8FF" />
            <circle cx="265" cy="235" r="40" fill="#8B0000" />
            <text x="210" y="200" font-family="sans-serif" font-size="20" font-weight="bold" fill="#111">GREATEST HITS</text>
            <path fill="none" stroke="#111" stroke-width="4" d="M 180 300 L 320 300 M 180 315 L 280 315" />
            
            <!-- Cracked Front Cover -->
            <path class="outline" fill="none" stroke="#FFF" stroke-width="4" d="M 380 150 L 320 200 L 280 180 L 200 240" />
            <path class="outline" fill="none" stroke="#FFF" stroke-width="4" d="M 320 200 L 300 280" />
            <path class="outline" fill="none" stroke="#FFF" stroke-width="4" d="M 250 350 L 280 300" />
            
            <!-- Hinge Details -->
            <rect x="140" y="130" width="10" height="20" fill="#333" />
            <rect x="140" y="320" width="10" height="20" fill="#333" />
        </g>
    )SVG";

    // 7. Encyclopedia Page
    items["encyclopedia_page.svg"] = R"SVG(
        <g transform="rotate(-5 256 256)">
            <!-- Torn Page Base -->
            <path class="outline" fill="#FDF5E6" d="M 120 100 L 380 90 L 390 400 L 150 420 Z" />
            
            <!-- Torn Left Edge (from binding) -->
            <path class="outline" fill="#F5DEB3" d="M 120 100 L 130 150 L 115 200 L 135 250 L 110 300 L 140 350 L 150 420 Z" />
            
            <!-- Page Content (Two columns of tiny text) -->
            <!-- Column 1 -->
            <rect x="150" y="130" width="100" height="250" fill="#333" opacity="0.3" />
            <rect x="150" y="130" width="100" height="5" fill="#111" />
            <rect x="150" y="150" width="80" height="5" fill="#111" />
            <rect x="150" y="170" width="100" height="5" fill="#111" />
            <rect x="150" y="190" width="60" height="5" fill="#111" />
            
            <!-- Diagram / Image -->
            <rect x="270" y="130" width="90" height="90" class="outline" fill="#D3D3D3" />
            <circle cx="315" cy="175" r="30" fill="#4682B4" />
            <path fill="none" stroke="#111" stroke-width="2" d="M 315 145 L 315 205 M 285 175 L 345 175" />
            
            <!-- Column 2 Text -->
            <rect x="270" y="240" width="90" height="140" fill="#333" opacity="0.3" />
            <rect x="270" y="240" width="90" height="5" fill="#111" />
            <rect x="270" y="260" width="70" height="5" fill="#111" />
            <rect x="270" y="280" width="90" height="5" fill="#111" />
            
            <!-- Page Number -->
            <text x="350" y="400" font-family="serif" font-size="16" fill="#111">Vol 4, 1042</text>
            
            <!-- Folds -->
            <path fill="none" stroke="#D2B48C" stroke-width="2" d="M 120 200 L 385 200" opacity="0.6" />
        </g>
    )SVG";

    // 8. Book Dust Jacket
    items["book_dust_jacket.svg"] = R"SVG(
        <g transform="rotate(10 256 256)">
            <!-- Flat jacket shape -->
            <path class="outline" fill="#2E8B57" d="M 80 150 L 420 120 L 440 320 L 100 350 Z" />
            <path class="highlight" d="M 90 160 L 410 130 L 415 150 L 95 180 Z" />
            
            <!-- Spine fold lines -->
            <path class="outline" fill="none" stroke-width="4" stroke-dasharray="10 5" d="M 200 140 L 220 335" />
            <path class="outline" fill="none" stroke-width="4" stroke-dasharray="10 5" d="M 240 135 L 260 330" />
            
            <!-- Back Cover Flap (Torn) -->
            <path class="outline" fill="#3CB371" d="M 100 350 L 80 150 L 50 150 L 70 355 Z" />
            
            <!-- Front Cover Art -->
            <text x="280" y="220" font-family="serif" font-size="32" font-weight="bold" fill="#FFD700" transform="rotate(-5 280 220)">MYSTERY</text>
            <path class="outline" fill="#FFD700" d="M 320 250 L 350 250 L 335 290 Z" />
            
            <!-- Spine Text -->
            <text x="215" y="250" font-family="sans-serif" font-size="20" font-weight="bold" fill="#FFF" transform="rotate(-85 215 250)">AUTHOR</text>
            
            <!-- Tears and rips -->
            <path class="outline" fill="none" stroke-width="6" d="M 420 120 L 410 140 L 430 160 L 425 180 L 445 190" />
            <path fill="none" stroke="#228B22" stroke-width="4" d="M 280 280 L 380 270" />
        </g>
    )SVG";

    // 9. Torn Book Page
    items["torn_book_page.svg"] = R"SVG(
        <g transform="rotate(-15 256 256)">
            <!-- Torn irregular paper piece -->
            <path class="outline" fill="#FFF8DC" d="M 180 150 Q 250 140 320 160 L 350 350 L 250 320 L 150 380 Z" />
            
            <!-- Ripped edges on top and bottom -->
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="miter" d="M 180 150 L 190 140 L 210 160 L 230 130 L 260 150 L 280 140 L 300 170 L 320 160" />
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="miter" d="M 350 350 L 330 330 L 300 340 L 280 320 L 260 330 L 240 310 L 210 340 L 180 360 L 150 380" />
            
            <!-- Book text (Large font, novel) -->
            <text x="200" y="200" font-family="serif" font-size="24" fill="#111">"It was the</text>
            <text x="195" y="230" font-family="serif" font-size="24" fill="#111">best of times,</text>
            <text x="190" y="260" font-family="serif" font-size="24" fill="#111">it was the</text>
            <text x="185" y="290" font-family="serif" font-size="24" fill="#111">worst of</text>
            
            <path fill="none" stroke="#D3D3D3" stroke-width="2" d="M 250 150 L 220 380" opacity="0.5" />
        </g>
    )SVG";

    // 10. Empty Ink Cartridge
    items["empty_ink_cartridge.svg"] = R"SVG(
        <g transform="rotate(25 256 256)">
            <!-- Cartridge Plastic Body -->
            <path class="outline" fill="#111111" d="M 150 200 L 300 200 L 300 350 L 150 350 Z" />
            <path class="highlight" d="M 160 210 L 290 210 L 290 230 L 160 230 Z" />
            
            <!-- Ink Viewport (Clear plastic, smudged ink) -->
            <rect x="180" y="240" width="80" height="80" class="outline" fill="#D3D3D3" />
            <!-- Ink droplets inside -->
            <circle cx="200" cy="300" r="10" fill="#000" />
            <circle cx="230" cy="310" r="15" fill="#000" />
            <circle cx="250" cy="280" r="8" fill="#000" />
            <path fill="#000" d="M 180 300 L 260 300 L 260 320 L 180 320 Z" />
            
            <!-- Gold Contact Chip -->
            <rect x="300" y="250" width="15" height="50" fill="#FFD700" class="outline" />
            <path fill="none" stroke="#B8860B" stroke-width="2" d="M 300 260 L 315 260 M 300 275 L 315 275 M 300 290 L 315 290" />
            
            <!-- Label (Cyan/Magenta/Yellow stripes) -->
            <rect x="150" y="200" width="150" height="20" fill="#FFF" />
            <rect x="160" y="205" width="40" height="10" fill="#00FFFF" />
            <rect x="200" y="205" width="40" height="10" fill="#FF00FF" />
            <rect x="240" y="205" width="40" height="10" fill="#FFFF00" />
            
            <!-- Ink leak -->
            <path fill="#000" d="M 315 280 Q 340 280 330 300 Q 320 320 315 290 Z" />
        </g>
    )SVG";

    std::cout << "Starting generation of HIGH DETAIL Public Library SVG trash items..." << std::endl;
    for (const auto& pair : items) {
        writeSVG(pair.first, pair.second);
    }
    std::cout << "All SVGs generated successfully!" << std::endl;

    return 0;
}
