const cache = new Map<string, any>();

export const ALLOWED_ANIMATIONS = [
  'Thanksgiving basket.json',
  'Basket.json',
  'Grocery-animation.json'
];

export const getAnimationData = async (name: string): Promise<any> => {
  if (cache.has(name)) return cache.get(name);

  try {
    const response = await fetch(`/animations/${name}`);
    const data = await response.json();
    cache.set(name, data);
    return data;
  } catch (err) {
    console.error(`Failed to load animation ${name}:`, err);
    return null;
  }
};

export const preloadAnimations = () => {
  ALLOWED_ANIMATIONS.forEach(name => {
    getAnimationData(name);
  });
};
