import React from 'react';
import Image from 'next/image';

interface FeatureCardProps {
  title: string;
  description: string;
  iconPath?: string;
  imagePath?: string;
  iconText?: string;
  switchText?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  title, 
  description, 
  iconPath, 
  imagePath = '/placeholder-feature.png',
  iconText,
  switchText
}) => {
  return (
    <div className="flex flex-col mb-20 md:mb-24">
      <div className="flex items-center space-x-3 mb-4">
        {iconPath && (
          <div className="w-8 h-8 flex items-center justify-center">
            <Image 
              src={iconPath} 
              alt={`${title} icon`} 
              width={32} 
              height={32} 
              className="object-contain"
            />
          </div>
        )}
        {iconText && (
          <span className="text-grayscale-800 font-medium">{iconText}</span>
        )}
        {switchText && (
          <div className="ml-auto bg-gray-100 px-3 py-1 rounded-full text-sm text-grayscale-800">
            {switchText}
          </div>
        )}
      </div>

      <h3 className="text-xl md:text-2xl font-heading font-bold mb-2">
        {title}
      </h3>
      <p className="text-grayscale-700 mb-6">
        {description}
      </p>

      <div className="mt-auto w-full">
        <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden shadow-md">
          {/* Placeholder para la imagen de la característica */}
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-grayscale-500 text-center px-4">Imagen de {title}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureSection = () => {
  const features = [
    {
      title: "Auto-archives old tabs",
      description: "No more virtual dust bunnies.",
      iconPath: "/globe.svg",
      iconText: "Archive inactive tabs",
      switchText: "After 1 day"
    },
    {
      title: "Sync your passwords",
      description: "across iCloud keychain or your preferred password extension.",
      iconPath: "/file.svg",
      iconText: "Password for zentry.app",
    },
    {
      title: "A clean and crisp reader mode",
      description: "for every article.",
      iconPath: "/window.svg",
      iconText: "Reader mode",
      switchText: "On"
    },
    {
      title: "Go completely undercover",
      description: "with incognito mode.",
      iconPath: "/globe.svg",
    },
    {
      title: "Break language barriers",
      description: "with translations on any page.",
      iconPath: "/globe.svg",
      iconText: "Translation",
      switchText: "On"
    }
  ];

  return (
    <section className="w-full py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-12 text-center">
          A lighter browsing experience
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              title={feature.title} 
              description={feature.description} 
              iconPath={feature.iconPath}
              iconText={feature.iconText}
              switchText={feature.switchText}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection; 