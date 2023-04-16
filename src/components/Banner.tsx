export type BannerData = {
    message: string;
    state: 'success' | 'error';
}

export default function Banner({banner: {message, state}}: {banner: BannerData}) {
    const isSuccsess = state === 'success';
    const icon = isSuccsess ? '✅' : '❌';
    return <p className={`p-2 ${isSuccsess? 'bg-green-300' : "bg-red-300"}`}>
        {`${icon} ${message}`}
    </p>
}