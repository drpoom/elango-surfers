from PIL import Image
import numpy as np

def make_transparent(path, bg_color, tolerance=30):
    img = Image.open(path).convert('RGBA')
    arr = np.array(img)
    # Create alpha mask: pixels close to bg_color become transparent
    r, g, b = bg_color
    mask = (np.abs(arr[:,:,0].astype(int) - r) < tolerance) & \
           (np.abs(arr[:,:,1].astype(int) - g) < tolerance) & \
           (np.abs(arr[:,:,2].astype(int) - b) < tolerance)
    arr[:,:,3] = np.where(mask, 0, 255)
    result = Image.fromarray(arr)
    # Save as PNG (preserves alpha)
    out_path = path.rsplit('.', 1)[0] + '.png'
    result.save(out_path)
    print(f'Saved {out_path}')
    return out_path

make_transparent('public/assets/stage3/tree_skyscraper.webp', (255, 255, 255))
make_transparent('public/assets/stage3/boss_spaghetti_meatball.png', (255, 255, 255))
make_transparent('public/assets/stage3/obstacle-metal-beam.webp', (162, 162, 162))
