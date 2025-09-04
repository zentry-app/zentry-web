export function TramiteListo({ className = "" }) {
    return (
        <div className="flex">
            <span className="sr-only">Zentry Web</span>
            <div className="flex">
                <div className="flex items-center">
                    <div className="inline-block relative">
                        <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                            Z
                        </div>
                    </div>
                </div>
                <div className="ml-2 flex flex-col justify-center">
                    <div className="text-lg font-semibold flex items-end">
                        <span className="text-blue-600">Zentry</span>
                        <span className="tracking-tight">Web</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TramiteListoSymbol({ className = "" }) {
    return (
        <div className={className}>
            <span className="sr-only">Zentry Web</span>
            <div className="inline-block relative">
                <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                    Z
                </div>
            </div>
        </div>
    );
}

export function TramiteListoLogo({ className = "" }) {
    return (
        <div className={className}>
            <TramiteListo className={className} />
        </div>
    );
} 