import { kv } from '@vercel/kv';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Body from '@/components/Body';

async function getAllKv(id: string) {
  const data = await kv.hgetall<{
    prompt: string;
    displayImg?: string;
    passwordImg?: string;
    wifi_name?: string;
    model_latency?: string;
  }>(id);

  return data;
}

export async function generateMetadata({
  params,
}: {
  params: {
    id: string;
  };
}): Promise<Metadata | undefined> {
  const data = await getAllKv(params.id);

  if (!data) {
    return;
  }

  const title = `Wifi Qr Code Generator: ${data.prompt}`;
  const description = `A QR code generated from nopasswords.xyz linking to: ${data.wifi_name}`;
  const image = data.displayImg || 'https://nopasswords.xyz/og-image.png';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@emergingbits',
    },
  };
}

export default async function Results({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const data = await getAllKv(params.id);
  if (!data) {
    notFound();
  }
  return (
    <Body
      prompt={data.prompt}
      imageUrl={data.displayImg}
      downloadUrl={data.passwordImg}
      renderedWifiName={data.wifi_name}
      modelLatency={Number(data.model_latency)}
      id={params.id}
    />
  );
}
