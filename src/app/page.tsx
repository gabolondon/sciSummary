"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UploadCloud, FileText, X, BrainCircuit, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { generateSummaryAction } from "@/app/actions";

const formSchema = z.object({
  userContext: z.string().min(10, {
    message: "Context must be at least 10 characters.",
  }).max(500, {
    message: "Context must not be longer than 500 characters."
  }),
  summaryLength: z.enum(["short", "medium", "large"], {
    required_error: "You need to select a summary length.",
  }),
});

export default function SciSummaryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [articleText, setArticleText] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userContext: "",
      summaryLength: "medium",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "text/plain" && selectedFile.size <= 5000000) { // 5MB limit
        setFile(selectedFile);
        setSummary(null);
        form.reset();
        const reader = new FileReader();
        reader.onload = (event) => {
          setArticleText(event.target?.result as string);
        };
        reader.onerror = () => {
          toast({
            variant: "destructive",
            title: "Error Reading File",
            description: "There was an issue reading your file. Please try again.",
          });
        };
        reader.readAsText(selectedFile);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: "Please upload a .txt file that is less than 5MB.",
        });
        e.target.value = "";
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setArticleText(null);
    setSummary(null);
    form.reset();
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!articleText) {
      toast({
        variant: "destructive",
        title: "No Article Found",
        description: "Please upload an article before generating a summary.",
      });
      return;
    }

    setSummary(null);

    startTransition(async () => {
      const result = await generateSummaryAction({ ...values, articleText });
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Summarization Failed",
          description: result.error,
        });
      } else {
        setSummary(result.summary || null);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight text-primary">
            SciSummary
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Generate scientific article summaries tailored to your expertise.
          </p>
        </header>

        <Card className="w-full transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Generator</CardTitle>
            <CardDescription>
              Upload a .txt article, provide your context, and choose a length.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <label htmlFor="file-upload" className="relative block w-full border-2 border-dashed rounded-lg p-12 text-center hover:border-primary cursor-pointer transition-colors duration-200">
                <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                  <UploadCloud className="w-12 h-12" />
                  <span className="font-medium">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-sm">TXT files only (Max 5MB)</span>
                </div>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,text/plain" />
              </label>
            ) : (
              <div className="flex items-center justify-between bg-secondary p-3 rounded-md">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="font-mono text-sm truncate">{file.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
            
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${file ? "max-h-[1000px] opacity-100 pt-6" : "max-h-0 opacity-0"}`}>
              {file && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="userContext"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-lg">
                            <BrainCircuit className="h-5 w-5 text-primary" />
                            Your Background / Context
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., 'A high school student interested in biology', 'A machine learning researcher specializing in NLP', etc."
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="summaryLength"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-lg">Desired Summary Length</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col sm:flex-row gap-4"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="short" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Short (Concise overview)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="medium" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Medium (Detailed summary)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="large" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Large (In-depth explanation)
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate Summary
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </CardContent>
        </Card>

        {isPending && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Generating Summary...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        )}
        
        {summary && (
           <div className="mt-8 transition-opacity duration-500" style={{opacity: summary ? 1 : 0}}>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary">Generated Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none text-base leading-relaxed text-foreground/90">
                  {summary.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
