import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex flex-col items-start px-2 py-1">
            <div className="flex items-center font-black tracking-tighter text-2xl leading-none">
                <span className="text-[#00aeef]">VIS</span>
                <span className="text-[#737578]">MASS</span>
            </div>
            <span className="text-[10px] font-medium text-[#444] tracking-wider mt-0.5 uppercase">
                Sri Lanka - Yakkala
            </span>
        </div>
    );
}
