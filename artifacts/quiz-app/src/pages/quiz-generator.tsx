import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListBoards, getListBoardsQueryKey,
  useListStandards, getListStandardsQueryKey,
  useListSubjects, getListSubjectsQueryKey,
  useListChapters, getListChaptersQueryKey,
  useListTopics, getListTopicsQueryKey,
  useGenerateQuiz, useListQuizHistory, getListQuizHistoryQueryKey,
  useGetSettings, getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Loader2, History, LibraryBig, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { QuizDisplay } from "@/components/quiz-display";
import { format } from "date-fns";

const generateSchema = z.object({
  boardId: z.string().min(1, "Board is required"),
  standardId: z.string().min(1, "Standard is required"),
  subjectId: z.string().min(1, "Subject is required"),
  chapterId: z.string().min(1, "Chapter is required"),
  topicId: z.string().min(1, "Topic is required"),
  questionCount: z.number().min(1).max(50),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

type GenerateFormValues = z.infer<typeof generateSchema>;

export default function QuizGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatedQuestions, setGeneratedQuestions] = useState<any[] | null>(null);

  const form = useForm<GenerateFormValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      boardId: "",
      standardId: "",
      subjectId: "",
      chapterId: "",
      topicId: "",
      questionCount: 10,
      difficulty: "medium",
    },
  });

  const selectedBoard = form.watch("boardId");
  const selectedStandard = form.watch("standardId");
  const selectedSubject = form.watch("subjectId");
  const selectedChapter = form.watch("chapterId");

  const [, setLocation] = useLocation();
  const { data: settings } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });

  const { data: boards, isLoading: isLoadingBoards } = useListBoards({ query: { queryKey: getListBoardsQueryKey() } });
  const { data: standards } = useListStandards({ boardId: Number(selectedBoard) || undefined }, { query: { enabled: !!selectedBoard, queryKey: getListStandardsQueryKey({ boardId: Number(selectedBoard) || undefined }) } });
  const { data: subjects } = useListSubjects({ standardId: Number(selectedStandard) || undefined }, { query: { enabled: !!selectedStandard, queryKey: getListSubjectsQueryKey({ standardId: Number(selectedStandard) || undefined }) } });
  const { data: chapters } = useListChapters({ subjectId: Number(selectedSubject) || undefined }, { query: { enabled: !!selectedSubject, queryKey: getListChaptersQueryKey({ subjectId: Number(selectedSubject) || undefined }) } });
  const { data: topics } = useListTopics({ chapterId: Number(selectedChapter) || undefined }, { query: { enabled: !!selectedChapter, queryKey: getListTopicsQueryKey({ chapterId: Number(selectedChapter) || undefined }) } });
  const { data: history } = useListQuizHistory({ query: { queryKey: getListQuizHistoryQueryKey() } });

  const generateQuiz = useGenerateQuiz();

  const onSubmit = (data: GenerateFormValues) => {
    generateQuiz.mutate({ 
      data: { 
        topicId: Number(data.topicId), 
        questionCount: data.questionCount, 
        difficulty: data.difficulty 
      } 
    }, {
      onSuccess: (response) => {
        toast({
          title: "Quiz Generated Successfully",
          description: `Generated ${response.questions.length} questions.`,
        });
        setGeneratedQuestions(response.questions);
        queryClient.invalidateQueries({ queryKey: getListQuizHistoryQueryKey() });
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.error ||
          error?.message ||
          "Could not generate questions. Please check your API settings.";
        toast({
          title: "Generation Failed",
          description: message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Quiz Generator</h1>
        <p className="text-muted-foreground mt-2">Generate precise, targeted questions from your curriculum.</p>
      </div>

      {settings && !settings.hasKey && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800 px-4 py-3 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-yellow-500" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">No API key configured.</span>{" "}
            Go to{" "}
            <button
              onClick={() => setLocation("/settings")}
              className="underline font-medium hover:no-underline"
            >
              Settings
            </button>{" "}
            and enter your AI API key before generating questions.
          </div>
        </div>
      )}

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="generate"><Wand2 className="w-4 h-4 mr-2"/> Generate</TabsTrigger>
          <TabsTrigger value="history"><History className="w-4 h-4 mr-2"/> History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                  <CardDescription>Select topic and parameters</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      
                      <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                        <FormField
                          control={form.control}
                          name="boardId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Board</FormLabel>
                              <Select onValueChange={(val) => {
                                field.onChange(val);
                                form.setValue("standardId", "");
                                form.setValue("subjectId", "");
                                form.setValue("chapterId", "");
                                form.setValue("topicId", "");
                              }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select Board" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {boards?.map(b => (
                                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="standardId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Standard</FormLabel>
                              <Select disabled={!selectedBoard} onValueChange={(val) => {
                                field.onChange(val);
                                form.setValue("subjectId", "");
                                form.setValue("chapterId", "");
                                form.setValue("topicId", "");
                              }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select Standard" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {standards?.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="subjectId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Subject</FormLabel>
                              <Select disabled={!selectedStandard} onValueChange={(val) => {
                                field.onChange(val);
                                form.setValue("chapterId", "");
                                form.setValue("topicId", "");
                              }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select Subject" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {subjects?.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="chapterId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Chapter</FormLabel>
                              <Select disabled={!selectedSubject} onValueChange={(val) => {
                                field.onChange(val);
                                form.setValue("topicId", "");
                              }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select Chapter" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {chapters?.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="topicId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Topic</FormLabel>
                              <Select disabled={!selectedChapter} onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select Topic" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {topics?.map(t => (
                                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="questionCount"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between pb-2">
                              <FormLabel>Number of Questions</FormLabel>
                              <span className="text-sm font-medium px-2 py-0.5 bg-primary/10 text-primary rounded">{field.value}</span>
                            </div>
                            <FormControl>
                              <Slider
                                min={1}
                                max={50}
                                step={1}
                                value={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                                className="py-2"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full mt-4 h-12 text-lg" disabled={generateQuiz.isPending}>
                        {generateQuiz.isPending ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
                        ) : (
                          <><Wand2 className="mr-2 h-5 w-5" /> Generate Quiz</>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-8">
              {generatedQuestions ? (
                <QuizDisplay questions={generatedQuestions} />
              ) : (
                <div className="h-full min-h-[400px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-12 text-muted-foreground bg-muted/10">
                  <LibraryBig className="w-16 h-16 mb-4 text-muted-foreground/30" />
                  <h3 className="text-xl font-medium text-foreground mb-2">Ready to generate</h3>
                  <p className="max-w-sm mx-auto">Select a topic from your curriculum hierarchy on the left to generate targeted questions with AI.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="grid grid-cols-1 gap-6">
            {!history || history.length === 0 ? (
              <div className="text-center p-12 border rounded-xl border-dashed bg-muted/30">
                <History className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium text-foreground">No history</h3>
                <p className="text-muted-foreground mt-1">Quizzes you generate will appear here.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {history.map((session) => (
                  <div key={session.id} className="border rounded-xl p-6 bg-card shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-6 border-b">
                      <div>
                        <h2 className="text-2xl font-bold">{session.topicName}</h2>
                        <div className="text-muted-foreground mt-1 text-sm flex flex-wrap gap-x-2">
                          <span>{session.boardName}</span>
                          <span>&bull;</span>
                          <span>{session.standardName}</span>
                          <span>&bull;</span>
                          <span>{session.subjectName}</span>
                          <span>&bull;</span>
                          <span>{session.chapterName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex flex-col items-end">
                          <span className="text-muted-foreground">Generated on</span>
                          <span className="font-medium">{format(new Date(session.createdAt), "MMM d, yyyy h:mm a")}</span>
                        </div>
                      </div>
                    </div>
                    
                    <QuizDisplay questions={session.questions} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
