import { db } from '@/db';
import { products } from '@/db/schema';

async function main() {
    const sampleProducts = [
        {
            name: 'MacBook Pro 14"',
            description: 'High-end developer laptop with M3 Pro chip, 18GB unified memory, and 512GB SSD. Perfect for software development and creative work.',
            price: 249900,
            image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/32d8d3e4-6192-45fd-8627-00ca7f8b8fb4/generated_images/professional-product-photography-of-a-sl-b5d780df-20251007140959.jpg',
            stock: 15,
            category: 'laptops',
            createdAt: new Date('2024-01-10'),
        },
        {
            name: 'Dell XPS 15',
            description: 'Premium Windows laptop featuring Intel Core i7, 16GB RAM, 1TB SSD, and stunning 15.6" OLED display. Ideal for professionals.',
            price: 189900,
            image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/32d8d3e4-6192-45fd-8627-00ca7f8b8fb4/generated_images/professional-product-photography-of-dell-2e235f63-20251007141008.jpg',
            stock: 22,
            category: 'laptops',
            createdAt: new Date('2024-01-12'),
        },
        {
            name: 'ThinkPad X1 Carbon',
            description: 'Ultra-lightweight business laptop with military-grade durability. Intel Core i5, 16GB RAM, 512GB SSD, and legendary keyboard.',
            price: 159900,
            image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/32d8d3e4-6192-45fd-8627-00ca7f8b8fb4/generated_images/professional-product-photography-of-leno-0c1ac001-20251007141018.jpg',
            stock: 18,
            category: 'laptops',
            createdAt: new Date('2024-01-15'),
        },
        {
            name: 'iPhone 15 Pro',
            description: 'Latest flagship with titanium design, A17 Pro chip, advanced camera system with 5x telephoto zoom, and Action button.',
            price: 119900,
            image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/32d8d3e4-6192-45fd-8627-00ca7f8b8fb4/generated_images/professional-product-photography-of-ipho-0a0261fb-20251007141027.jpg',
            stock: 45,
            category: 'phones',
            createdAt: new Date('2024-01-08'),
        },
        {
            name: 'Samsung Galaxy S24 Ultra',
            description: 'Android flagship with built-in S Pen, 200MP camera, Snapdragon 8 Gen 3, and stunning 6.8" Dynamic AMOLED display.',
            price: 109900,
            image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/32d8d3e4-6192-45fd-8627-00ca7f8b8fb4/generated_images/professional-product-photography-of-sams-df167c1d-20251007141038.jpg',
            stock: 38,
            category: 'phones',
            createdAt: new Date('2024-01-11'),
        },
        {
            name: 'Google Pixel 8 Pro',
            description: 'AI-powered phone with exceptional camera capabilities, Google Tensor G3 chip, and 7 years of software updates.',
            price: 89900,
            image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/32d8d3e4-6192-45fd-8627-00ca7f8b8fb4/generated_images/professional-product-photography-of-goog-56c871c2-20251007141045.jpg',
            stock: 30,
            category: 'phones',
            createdAt: new Date('2024-01-14'),
        },
        {
            name: 'iPad Pro 12.9"',
            description: 'Professional tablet with M2 chip, Liquid Retina XDR display, ProMotion technology, and Apple Pencil support.',
            price: 129900,
            image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/32d8d3e4-6192-45fd-8627-00ca7f8b8fb4/generated_images/professional-product-photography-of-ipad-395010d6-20251007141055.jpg',
            stock: 20,
            category: 'tablets',
            createdAt: new Date('2024-01-09'),
        },
        {
            name: 'Samsung Galaxy Tab S9+',
            description: 'Premium Android tablet with S Pen included, Dynamic AMOLED 2X display, DeX mode for desktop experience.',
            price: 99900,
            image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/32d8d3e4-6192-45fd-8627-00ca7f8b8fb4/generated_images/professional-product-photography-of-sams-b05e79ab-20251007141105.jpg',
            stock: 25,
            category: 'tablets',
            createdAt: new Date('2024-01-13'),
        },
        {
            name: 'AirPods Pro (2nd Gen)',
            description: 'Premium wireless earbuds with active noise cancellation, spatial audio, and up to 6 hours of listening time.',
            price: 24900,
            image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/32d8d3e4-6192-45fd-8627-00ca7f8b8fb4/generated_images/professional-product-photography-of-appl-54144aea-20251007141114.jpg',
            stock: 50,
            category: 'accessories',
            createdAt: new Date('2024-01-07'),
        },
        {
            name: 'Mechanical Keyboard RGB',
            description: 'Gaming and productivity keyboard with Cherry MX switches, customizable RGB lighting, and aluminum frame.',
            price: 15900,
            image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/32d8d3e4-6192-45fd-8627-00ca7f8b8fb4/generated_images/professional-product-photography-of-mech-803504fa-20251007141134.jpg',
            stock: 35,
            category: 'accessories',
            createdAt: new Date('2024-01-16'),
        },
        {
            name: 'Wireless Ergonomic Mouse',
            description: 'Comfortable ergonomic design with precision tracking, programmable buttons, and 70-day battery life.',
            price: 7900,
            image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/32d8d3e4-6192-45fd-8627-00ca7f8b8fb4/generated_images/professional-product-photography-of-wire-ee68a29f-20251007141143.jpg',
            stock: 42,
            category: 'accessories',
            createdAt: new Date('2024-01-18'),
        },
        {
            name: 'USB-C Hub 7-in-1',
            description: 'Versatile adapter with HDMI 4K, USB 3.0 ports, SD card reader, USB-C PD charging, and Ethernet port.',
            price: 4900,
            image: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/32d8d3e4-6192-45fd-8627-00ca7f8b8fb4/generated_images/professional-product-photography-of-usb--68655367-20251007141313.jpg',
            stock: 48,
            category: 'accessories',
            createdAt: new Date('2024-01-20'),
        },
    ];

    await db.insert(products).values(sampleProducts);
    
    console.log('✅ Products seeder completed successfully - 12 tech products added');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});