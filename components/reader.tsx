'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { Button } from '@/components/ui/button';
import { BookmarkIcon, ChevronLeftIcon, ChevronRightIcon, MenuIcon, TextIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

// ... (previous interfaces remain the same)

export default function Reader() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [currentVerse, setCurrentVerse] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = async () => {
    try {
      const response = await fetch('https://bhagavadgitaapi.in/chapters');
      const data = await response.json();
      setChapters(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      setIsLoading(false);
      toast.error('Failed to load chapters. Please try again later.');
    }
  };

  const handleNextVerse = useCallback(() => {
    if (!chapters.length) return;
    
    if (currentVerse < (chapters[currentChapter]?.verses?.length ?? 0) - 1) {
      setCurrentVerse(currentVerse + 1);
    } else if (currentChapter < chapters.length - 1) {
      setCurrentChapter(currentChapter + 1);
      setCurrentVerse(0);
    }
  }, [currentVerse, currentChapter, chapters]);

  const handlePreviousVerse = useCallback(() => {
    if (!chapters.length) return;
    
    if (currentVerse > 0) {
      setCurrentVerse(currentVerse - 1);
    } else if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
      setCurrentVerse((chapters[currentChapter - 1]?.verses?.length ?? 1) - 1);
    }
  }, [currentVerse, currentChapter, chapters]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextVerse,
    onSwipedRight: handlePreviousVerse,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const toggleBookmark = () => {
    const existingBookmarkIndex = bookmarks.findIndex(
      (b) => b.chapter === currentChapter && b.verse === currentVerse
    );

    if (existingBookmarkIndex !== -1) {
      setBookmarks(bookmarks.filter((_, index) => index !== existingBookmarkIndex));
      toast.success('Bookmark removed');
    } else {
      setBookmarks([...bookmarks, { chapter: currentChapter, verse: currentVerse }]);
      toast.success('Bookmark added');
    }
  };

  const addHighlight = (text: string) => {
    setHighlights([...highlights, { chapter: currentChapter, verse: currentVerse, text }]);
    toast.success('Highlight added');
  };

  const currentChapterData = chapters[currentChapter];
  const currentVerseData = currentChapterData?.verses?.[currentVerse];

  return (
    <div className="min-h-screen bg-background text-foreground p-4" {...swipeHandlers}>
      <div className="max-w-2xl mx-auto">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Bhagavad Gita Reader</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={toggleBookmark}>
              <BookmarkIcon className="h-4 w-4" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <MenuIcon className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetTitle>Menu</SheetTitle>
                <Tabs defaultValue="bookmarks">
                  <TabsList>
                    <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                    <TabsTrigger value="highlights">Highlights</TabsTrigger>
                  </TabsList>
                  <TabsContent value="bookmarks">
                    <ScrollArea className="h-[300px]">
                      {bookmarks.map((bookmark, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          onClick={() => {
                            setCurrentChapter(bookmark.chapter);
                            setCurrentVerse(bookmark.verse);
                          }}
                        >
                          Chapter {bookmark.chapter + 1}, Verse {bookmark.verse + 1}
                        </Button>
                      ))}
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="highlights">
                    <ScrollArea className="h-[300px]">
                      {highlights.map((highlight, index) => (
                        <div key={index} className="mb-2">
                          <p className="text-sm text-muted-foreground">
                            Chapter {highlight.chapter + 1}, Verse {highlight.verse + 1}
                          </p>
                          <p>"{highlight.text}"</p>
                        </div>
                      ))}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading...</p>
            </div>
          ) : chapters.length > 0 && currentChapterData && currentVerseData ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentChapter}-${currentVerse}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-2">
                  Chapter {currentChapter + 1}: {currentChapterData.name}
                </h2>
                <p className="text-lg mb-4" style={{ fontSize: `${fontSize}px` }}>
                  {currentVerseData.text}
                </p>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p>No content available. Please try again later.</p>
            </div>
          )}
        </main>

        <footer className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <Button onClick={handlePreviousVerse} disabled={currentChapter === 0 && currentVerse === 0}>
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button onClick={handleNextVerse} disabled={currentChapter === chapters.length - 1 && currentVerse === (currentChapterData?.verses?.length ?? 0) - 1}>
              Next
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <TextIcon className="h-4 w-4" />
            <Slider
              min={12}
              max={24}
              step={1}
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}