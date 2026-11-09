import type { Metadata } from "next";
import "./globals.css";
import "./studio-theme.css";
import { StudioTheme } from "./studio-theme";
export const metadata:Metadata={metadataBase:new URL("https://dauvincistudio.netlify.app"),title:{default:"DauVinci Studio | Creative Design & Digital Experiences",template:"%s | DauVinci Studio"},description:"DauVinci Studio is a creative digital studio focused on thoughtful branding, graphic design and useful websites.",applicationName:"DauVinci Studio",icons:{icon:"/favicon.svg?v=dvs-2",shortcut:"/favicon.svg?v=dvs-2"},openGraph:{type:"website",siteName:"DauVinci Studio",title:"DauVinci Studio | Creative Design & Digital Experiences",description:"Thoughtful branding, graphic design and useful websites.",url:"https://dauvincistudio.netlify.app"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body className="antialiased"><StudioTheme>{children}</StudioTheme></body></html>}