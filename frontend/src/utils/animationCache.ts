const cache = new Map<string, any>();

export const ALLOWED_ANIMATIONS = [
  'bullock_cart.json',
  'Basket.json',
  'Grocery-animation.json',
  'Fruit Basket.json',
];

// Round-robin index to avoid re-fetching same animation randomly
let animationIndex = 0;

export const getNextAnimationName = (): string => {
  const name = ALLOWED_ANIMATIONS[animationIndex % ALLOWED_ANIMATIONS.length];
  animationIndex++;
  return name;
};

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
  const run = () => {
    ALLOWED_ANIMATIONS.forEach(name => {
      getAnimationData(name);
    });
  };

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(run, { timeout: 8000 });
  } else {
    setTimeout(run, 3000);
  }
};
