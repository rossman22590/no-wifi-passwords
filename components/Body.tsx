'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useState } from 'react';
import { QrGenerateRequest, QrGenerateResponse } from '@/utils/service';
import { QrCard } from '@/components/QrCard';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import LoadingDots from '@/components/ui/loadingdots';
import downloadQrCode from '@/utils/downloadQrCode';
import va from '@vercel/analytics';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';

const suggestions = [
  'alient planet with rectangles',
  'italian mountains in a James Bond movie',
  'industrial age with plants',
  'spiritual wicked geometry patterns, colorful',
  'rivers and streams in Peruvian forest',
  'waterfall in Bali with palm trees and ocean',
  'minimalist futuristic architecture',
  'futuristic robot creatures',
];

const encryptOptions = [
  { value: 'WPA', label: 'WPA' },
  { value: 'WEP', label: 'WEP' },
  { value: 'none', label: 'None' },
];

const generateFormSchema = z.object({
  wifi_name: z.string().min(1),
  wifi_password: z.string().min(1),
  prompt: z.string().min(3).max(160),
  encryption: z.string(),
});

type GenerateFormValues = z.infer<typeof generateFormSchema>;

const Body = ({
  imageUrl,
  downloadUrl,
  prompt,
  renderedWifiName,
  modelLatency,
  id,
}: {
  imageUrl?: string;
  downloadUrl?: string;
  prompt?: string;
  renderedWifiName?: string;
  modelLatency?: number;
  id?: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<QrGenerateResponse | null>(null);
  // const [submittedURL, setSubmittedURL] = useState<string | null>(null);
  const [isSubmitted, setSubmit] = useState(false);

  const router = useRouter();

  const form = useForm<GenerateFormValues>({
    resolver: zodResolver(generateFormSchema),
    mode: 'onChange',

    // Set default values so that the form inputs are controlled components.
    defaultValues: {
      wifi_name: '',
      wifi_password: '',
      prompt: '',
      encryption: encryptOptions[0].value,
    },
  });

  useEffect(() => {
    // this gets triggered when we navigate to the /start/[id] page & we need to set isSubmitted to true
    if (
      imageUrl &&
      prompt &&
      downloadUrl &&
      renderedWifiName &&
      modelLatency &&
      id
    ) {
      setResponse({
        image_url: imageUrl,
        download_url: downloadUrl,
        model_latency_ms: modelLatency,
        id: id,
      });
      setSubmit(true);

      // need to set this for the form later
      form.setValue('prompt', prompt);
      form.setValue('wifi_name', renderedWifiName);
    }
  }, [imageUrl, modelLatency, prompt, renderedWifiName, id, form, downloadUrl]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      form.setValue('prompt', suggestion);
    },
    [form],
  );

  const handleSubmit = useCallback(
    async (values: GenerateFormValues) => {
      setIsLoading(true);
      setResponse(null);
      setSubmit(true);

      try {
        const request: QrGenerateRequest = {
          wifi_name: values.wifi_name,
          wifi_password: values.wifi_password,
          prompt: values.prompt,
          encryption: values.encryption,
        };
        const response = await fetch('/api/generate', {
          method: 'POST',
          body: JSON.stringify(request),
        });

        // Handle API errors.
        if (!response.ok || response.status !== 200) {
          const text = await response.text();
          throw new Error(
            `Failed to generate QR code: ${response.status}, ${text}`,
          );
        }

        const data = await response.json();

        va.track('Generated QR Code', {
          prompt: values.prompt,
        });

        router.push(`/results/${data.id}`);
      } catch (error) {
        va.track('Failed to generate', {
          prompt: values.prompt,
        });
        if (error instanceof Error) {
          setError(error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  return (
    <div
      id="gen-qr"
      className="flex justify-center items-center flex-col w-full lg:p-0 p-4 sm:mb-28 mb-0"
    >
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mt-10">
        <div className="col-span-1">
          <h1 className="text-3xl font-bold mb-10">Generate a Wifi QR Code</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="wifi_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wifi Network Name (SSID)</FormLabel>
                      <FormControl>
                        <Input placeholder="infinity_5g" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="wifi_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wifi Password</FormLabel>
                      <FormControl>
                        <Input placeholder="..." {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="encryption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Encyption <i>(Default WPA should work for most)</i>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              defaultValue={encryptOptions[0].value}
                              placeholder={encryptOptions[0].label}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {encryptOptions.map((option) => (
                            <SelectItem key={option.label} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Japanese idyllic town"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="">
                        This is what the image in your QR code will look like.
                      </FormDescription>

                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="my-2 w-full">
                  <p className="text-sm font-medium mb-3">Prompt suggestions</p>
                  <div className="grid sm:grid-cols-2 grid-cols-1 gap-3 text-center text-sm ">
                    <Select
                      onValueChange={(x) => handleSuggestionClick(x)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="for some inspiration..." />
                      </SelectTrigger>
                      <SelectContent>
                        {suggestions.map((suggestion) => (
                          <SelectItem value={suggestion} key={suggestion}>
                            {suggestion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center
                 max-w-[200px] mx-auto w-full"
                >
                  {isLoading ? (
                    <LoadingDots color="white" />
                  ) : response ? (
                    '✨ Regenerate'
                  ) : (
                    'Generate'
                  )}
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </form>
          </Form>
        </div>
        <div className="col-span-1">
          {isSubmitted && (
            <>
              <h1 className="text-3xl font-bold sm:mb-5 mb-5 mt-5 sm:mt-0 sm:text-center text-left">
                Your Wifi QR Code
              </h1>
              <div>
                <div className="flex flex-col justify-center relative h-auto items-center">
                  {response ? (
                    <QrCard
                      imageURL={response.image_url}
                      time={(response.model_latency_ms / 1000).toFixed(2)}
                    />
                  ) : (
                    <div className="relative flex flex-col justify-center items-center gap-y-2 w-[510px] border border-gray-300 rounded shadow group p-2 mx-auto animate-pulse bg-gray-400 aspect-square max-w-full" />
                  )}
                </div>
                {response && (
                  <div className="flex justify-center gap-5 mt-4">
                    <Button
                      onClick={() =>
                        downloadQrCode(response.download_url, 'wifiQrCode')
                      }
                    >
                      Download With Password
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        downloadQrCode(response.image_url, 'wifiQrCode')
                      }
                    >
                      Download Without Password
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default Body;
