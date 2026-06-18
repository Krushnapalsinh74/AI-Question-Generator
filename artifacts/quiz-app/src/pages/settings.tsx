import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetSettings, useSaveSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, CheckCircle2, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const settingsSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  model: z.string().min(1, "Model is required"),
  apiKey: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const saveSettings = useSaveSettings();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      provider: "openai",
      model: "gpt-4o",
      apiKey: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        provider: settings.provider || "openai",
        model: settings.model || "gpt-4o",
        apiKey: "", // We don't populate the actual key for security
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SettingsFormValues) => {
    if (!data.apiKey && !settings?.hasKey) {
      toast({
        title: "API Key required",
        description: "Please enter your API key.",
        variant: "destructive",
      });
      return;
    }

    // Send "__preserve__" as a sentinel when the user leaves the field blank
    // and an existing key is already saved — the backend will keep the stored key
    saveSettings.mutate({ data: { provider: data.provider, model: data.model, apiKey: data.apiKey || "__preserve__" } }, {
      onSuccess: () => {
        toast({
          title: "Settings saved",
          description: "Your API settings have been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        form.setValue("apiKey", "");
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to save settings.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card className="max-w-2xl">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const providerModels: Record<string, { id: string, name: string }[]> = {
    openai: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "gpt-4.1", name: "GPT-4.1" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
    ],
    anthropic: [
      { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
    ],
    gemini: [
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    ]
  };

  const selectedProvider = form.watch("provider");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">API Settings</h1>
        <p className="text-muted-foreground mt-2">Configure the AI provider for generating quizzes.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
          <CardDescription>
            Enter your API credentials to enable quiz generation.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                <div className={`p-3 rounded-full ${settings?.hasKey ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {settings?.hasKey ? <CheckCircle2 className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-medium">API Key Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {settings?.hasKey 
                      ? "A valid API key is currently saved." 
                      : "No API key found. Please provide one."}
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={(val) => {
                      field.onChange(val);
                      form.setValue("model", providerModels[val][0].id);
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the AI service you want to use.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providerModels[selectedProvider]?.map(model => (
                          <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the specific model to generate questions.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key {settings?.hasKey && "(Leave blank to keep existing)"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={settings?.hasKey ? "••••••••••••••••••••••••" : "sk-..."} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Your API key is stored securely and never exposed.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button type="button" variant="outline" onClick={() => form.reset()}>Cancel</Button>
              <Button type="submit" disabled={saveSettings.isPending}>
                {saveSettings.isPending ? "Saving..." : "Save Settings"}
                {!saveSettings.isPending && <Save className="ml-2 w-4 h-4" />}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
