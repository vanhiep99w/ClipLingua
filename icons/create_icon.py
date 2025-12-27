#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont

def create_icon(size):
    # Create image with rounded square background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle with gradient-like effect
    margin = size // 10
    corner_radius = size // 4
    
    # Main background - modern gradient colors
    draw.rounded_rectangle([margin, margin, size-margin, size-margin], 
                          radius=corner_radius, fill='#10B981', outline='#059669', width=max(1, size//40))
    
    # Draw translation arrows icon
    center_x = size // 2
    center_y = size // 2
    arrow_size = size // 3
    
    # Left arrow (←)
    arrow_width = max(2, size // 20)
    draw.line([(center_x - arrow_size//4, center_y - arrow_size//4),
               (center_x - arrow_size//2, center_y - arrow_size//4)], 
              fill='white', width=arrow_width)
    draw.line([(center_x - arrow_size//2, center_y - arrow_size//4),
               (center_x - arrow_size//3, center_y - arrow_size//2.5)], 
              fill='white', width=arrow_width)
    draw.line([(center_x - arrow_size//2, center_y - arrow_size//4),
               (center_x - arrow_size//3, center_y)], 
              fill='white', width=arrow_width)
    
    # Right arrow (→)
    draw.line([(center_x + arrow_size//4, center_y + arrow_size//4),
               (center_x + arrow_size//2, center_y + arrow_size//4)], 
              fill='white', width=arrow_width)
    draw.line([(center_x + arrow_size//2, center_y + arrow_size//4),
               (center_x + arrow_size//3, center_y + arrow_size//2.5)], 
              fill='white', width=arrow_width)
    draw.line([(center_x + arrow_size//2, center_y + arrow_size//4),
               (center_x + arrow_size//3, center_y)], 
              fill='white', width=arrow_width)
    
    return img

# Create icons
for size in [16, 48, 128]:
    icon = create_icon(size)
    icon.save(f'icon{size}.png')
    print(f'Created icon{size}.png')
