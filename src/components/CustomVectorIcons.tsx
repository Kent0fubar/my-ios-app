import React from 'react';
import { SvgXml } from 'react-native-svg';

export const GuitarIcon = ({ size = 24, color = "currentColor" }) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="currentColor" d="M19.59 3H22v2h-1.59l-4.24 4.24c-.37-.56-.85-1.04-1.41-1.41zM12 8a4 4 0 0 1 4 4a3.99 3.99 0 0 1-3 3.87V16a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5h.13c.45-1.76 2.04-3 3.87-3m0 2.5a1.5 1.5 0 0 0-1.5 1.5a1.5 1.5 0 0 0 1.5 1.5a1.5 1.5 0 0 0 1.5-1.5a1.5 1.5 0 0 0-1.5-1.5m-5.06 3.74l-.71.7l2.83 2.83l.71-.71z"/></svg>`.replace(/currentColor/g, color);
  return <SvgXml xml={xml} width={size} height={size} />;
};

export const BassIcon = ({ size = 24, color = "currentColor" }) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="currentColor" d="M19.59 3H22v2h-1.59l-5.29 5.29l-1.41-1.39zM12 9c.26 0 .5.1.71.3l2 2c.18.2.29.43.29.7l-.1.4l-4 8c-.19.35-.54.53-.9.53c-.35 0-.71-.18-.89-.53l-1.86-3.7l-3.7-1.8c-.37-.2-.55-.55-.55-.9s.18-.7.55-.9l8-4c.14-.1.29-.1.45-.1m-2.65 2.82l-.7.68l2.85 2.85l.68-.7zm-1.41 1.41l-.71.71l2.83 2.83l.71-.71z"/></svg>`.replace(/currentColor/g, color);
  return <SvgXml xml={xml} width={size} height={size} />;
};

export const DrumsIcon = ({ size = 24, color = "currentColor" }) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512"><path fill="currentColor" d="m111 58.3l-87.37.4l-.61 8.3L192.4 92.6l1.8-8.1zm310.8 18.8l-.3 29.7l5-.8l4.9.8l-.3-29.7zM96.33 92.8l-1.81 13l-33.17 26.4l1.84 115.6l6.16-40.4l9.55-2.3h.28l-1.03-65l31.95-25.4l2.7-19.4zm330.17 25.9l-66.6 10.4l.6 8.3h132l.6-8.3zm-66 33.3l-.6 8.3l66.6 10.4l66.6-10.4l-.6-8.3zm60.3 30.5l-.2 20.8c2.8.5 5.6 1.2 8.5 1.8l3.3.8l-.2-23.4l-5.7.9zm-287.4 30.7c-16.5-.2-33.5 1.9-51.1 6.1l-2.86 18.8c23.26-3.3 75.96-6.9 127.56 14.6c4-1.6 8.2-3.1 12.4-4.3l1.2-8c-26.6-18.2-55.8-26.8-87.2-27.2m241.2 0c-31.4.4-60.6 9-87.2 27.2l1.2 8c4.2 1.2 8.4 2.7 12.4 4.3c51.6-21.5 104.3-17.9 127.6-14.6l-2.9-18.8c-17.6-4.2-34.6-6.3-51.1-6.1m-258.1 39c-17.91 0-32.1 1.8-39.69 3.1l-7.05 46.3l72.94 11.1c10.1-20.3 25.5-37.5 44.5-49.6c-25.4-8.5-50.4-10.9-70.7-10.9m275 0c-20.3 0-45.3 2.4-70.7 10.9c19 12.1 34.4 29.3 44.5 49.6l72.9-11.1l-7-46.3c-7.6-1.3-21.8-3.1-39.7-3.1m-137.5 10c-49.9 0-90.4 40.5-90.4 90.4S204.1 443 254 443s90.4-40.5 90.4-90.4s-40.5-90.4-90.4-90.4M64.27 315.5l1.36 85.5l-46.73 87h18.94l33.24-62l15.19 62h17.23l-21.19-86l-1.33-84zM433.6 317l-14.2 2.2l-.8 74.1l-24.2 55.7l7.4 25l24.7-57l30.9 71h18.2l-41.2-94.7zm-279.7 11.6c-4.7 12.1-7.2 25.2-7.2 38.9C146.7 427 194.8 475 254 475s107.3-48 107.3-107.5c0-13.7-2.5-26.8-7.2-38.9c1.8 7.7 2.8 15.8 2.8 24C356.9 409 310.8 456 254 456s-102.9-47-102.9-103.4c0-8.2 1-16.3 2.8-24m-18 77.4l-20.2 82h25.7l11.8-48c-7.4-11-13.3-22-17.3-34m236.2 0c-4 12-9.9 23-17.3 34l11.8 48h25.7z"/></svg>`.replace(/currentColor/g, color);
  return <SvgXml xml={xml} width={size} height={size} />;
};

export const VocalIcon = ({ size = 24, color = "currentColor" }) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="currentColor" d="M9 3a4 4 0 0 1 4 4H5a4 4 0 0 1 4-4m2.84 6.82L11 18h-1v1a2 2 0 0 0 2 2a2 2 0 0 0 2-2v-5a4 4 0 0 1 4-4h2l-1 1l1 1h-2a2 2 0 0 0-2 2v5a4 4 0 0 1-4 4a4 4 0 0 1-4-4v-1H7l-.84-8.18C5.67 9.32 5.31 8.7 5.13 8h7.74c-.18.7-.54 1.32-1.03 1.82M9 11a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1"/></svg>`.replace(/currentColor/g, color);
  return <SvgXml xml={xml} width={size} height={size} />;
};

export const KeyboardIcon = ({ size = 24, color = "currentColor" }) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v16a2 2 0 0 0 2 2h16c1.11 0 2-.89 2-2V4a2 2 0 0 0-2-2m-5.26 12H15v6H9v-6h.31c.55 0 .99-.44.99-1V4h3.45v9c0 .56.44 1 .99 1M4 4h2.8v9c0 .56.44 1 .99 1H8v6H4zm16 16h-4v-6h.26c.55 0 .99-.44.99-1V4H20z"/></svg>`.replace(/currentColor/g, color);
  return <SvgXml xml={xml} width={size} height={size} />;
};

export const PianoIcon = ({ size = 24, color = "currentColor" }) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512"><path fill="currentColor" d="m376.3 30.6l-63.3 3L61.43 230.9l261.47-51.5c5.8-4.6 10.9-9 15.4-13.1L302 75.6l15.5-6.2l33.7 84.2c55.1-60.2-20.4-71.1 25.1-123M357 168l-13.2 11.9l9.6 24.1c-9.1-.4-19.2-.6-30.5-.7L61.43 254.9s.34 2.2.84 5.5c2.36 15.5-7.73 30.2-23.07 33.6c-8.93 2-16.61 3.7-16.61 3.7l3.95 21.2l334.16 30.5l126-53.9l-.9-43.4c-81.1-8.7-11.4-39.4-114-47zm-16.2 51.3c7.1.1 13.4.4 19 .7l21.5 53.8l-273.6-14.5l209.9-39.9c8.5-.1 16.2-.2 23.2-.1m37.6 2.4c56.8 7.8 14.9 32.1 65 36.5l-44.9 13.5zM83.78 284.8L358.4 307l-18.1 16.1l-280.68-25.9zm-1.35 53.6l13.65 97.1l-3.47 6.2l.36 15.8l17.13 1.6l17.1-6.2v-13.2l-4.8-3.9l9.1-93zM184 350.5V426l105.2 9v-75.2l-16.7-1.5V417l-71.8-6v-59zm209.8 2.7l-29.4 10.9l-24.8-2l15.6 99.4l-3.9 5.1l.8 18l17.1 1.7l15.9-7.4l.3-13.2l-3.9-3.9zm-208.7 89.6l-28.4 9.5l3.1 14.4l102.3 10.1l21-7.4l1.1-18.3z"/></svg>`.replace(/currentColor/g, color);
  return <SvgXml xml={xml} width={size} height={size} />;
};

export const SaxophoneIcon = ({ size = 24, color = "currentColor" }) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="currentColor" d="M4 2a1 1 0 0 0-1 1a1 1 0 0 0 1 1a3 3 0 0 1 3 3v8.5c0 3.6 2.9 6.5 6.5 6.5s6.5-2.9 6.5-6.5V13a1 1 0 0 0 1-1a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1a1 1 0 0 0 1 1v2a1 1 0 0 1-1 1a1 1 0 0 1-1-1v-4a1 1 0 0 0 1-1a1 1 0 0 0-1-1V8a1 1 0 0 0 1-1a1 1 0 0 0-1-1v-.5A3.5 3.5 0 0 0 8.5 2z"/></svg>`.replace(/currentColor/g, color);
  return <SvgXml xml={xml} width={size} height={size} />;
};

export const TrumpetIcon = ({ size = 24, color = "currentColor" }) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="currentColor" d="M22 6c-1 5-7 5-7 5H4c-1 0-2-1-2-1H1v4h1s1-1 2-1h.3c-.2.3-.3.6-.3 1v2c0 1.1.9 2 2 2h1v1h2v-1h1v1h2v-1h1v1h2v-1h1c1.1 0 2-.9 2-2v-2c0-.1 0-.3-.1-.4c1.7.6 3.5 1.8 4.1 4.4h1V6zM6 16.5c-.3 0-.5-.2-.5-.5v-2c0-.3.2-.5.5-.5h1v3zm3 0v-3h1v3zm3 0v-3h1v3zm4.5-.5c0 .3-.2.5-.5.5h-1v-3h1c.3 0 .5.2.5.5zM9 10H7V9h2zm3 0h-2V9h2zm3 0h-2V9h2z"/></svg>`.replace(/currentColor/g, color);
  return <SvgXml xml={xml} width={size} height={size} />;
};

export const ViolinIcon = ({ size = 24, color = "currentColor" }) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="currentColor" d="M11 2a1 1 0 0 0-1 1v6a.5.5 0 0 0 .5.5H12a.5.5 0 0 1 .5.5a.5.5 0 0 1-.5.5h-1.5C9.73 10.5 9 9.77 9 9V5.16C7.27 5.6 6 7.13 6 9v1.5A2.5 2.5 0 0 1 8.5 13A2.5 2.5 0 0 1 6 15.5V17c0 2.77 2.23 5 5 5h2c2.77 0 5-2.23 5-5v-1.5a2.5 2.5 0 0 1-2.5-2.5a2.5 2.5 0 0 1 2.5-2.5V9c0-2.22-1.78-4-4-4V3a1 1 0 0 0-1-1zm-.25 14.5h2.5l-.5 3.5h-1.5z"/></svg>`.replace(/currentColor/g, color);
  return <SvgXml xml={xml} width={size} height={size} />;
};

export const DjIcon = ({ size = 24, color = "currentColor" }) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="currentColor" d="M12 11a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1m0 5.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5s4.5 2 4.5 4.5s-2 4.5-4.5 4.5M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2"/></svg>`.replace(/currentColor/g, color);
  return <SvgXml xml={xml} width={size} height={size} />;
};

export const ProducerIcon = ({ size = 24, color = "currentColor" }) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="currentColor" d="M7 3H5v6h2zm12 0h-2v10h2zM3 13h2v8h2v-8h2v-2H3zm12-6h-2V3h-2v4H9v2h6zm-4 14h2V11h-2zm4-6v2h2v4h2v-4h2v-2z"/></svg>`.replace(/currentColor/g, color);
  return <SvgXml xml={xml} width={size} height={size} />;
};

export const SongwriterIcon = ({ size = 24, color = "currentColor" }) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="currentColor" d="m15.54 3.5l4.96 4.97l-1.43 1.41l-4.95-4.95zM3.5 19.78l6.5-6.47c-.1-.31-.03-.7.23-.96c.39-.39 1.03-.39 1.42 0c.39.4.39 1.03 0 1.42c-.26.26-.65.33-.96.23l-6.47 6.5l10.61-3.55l3.53-6.36l-4.94-4.95l-6.37 3.53z"/></svg>`.replace(/currentColor/g, color);
  return <SvgXml xml={xml} width={size} height={size} />;
};

