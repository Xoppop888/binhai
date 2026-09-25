from pathlib import Path
from PIL import Image

source = Path(__file__).resolve().parents[1] / 'public' / 'hero-car-carrier.png'
target = source.with_suffix('.webp')

with Image.open(source) as image:
    image.save(target, 'WEBP', quality=82, method=6)

print(f'Created {target}')
