- # Error Type
Runtime ReferenceError

## Error Message
Cannot access 'loadAdditionalQuestions' before initialization


    at BlogAIContent (app/(blog)/blog/[slug]/BlogAIContent.tsx:209:7)
    at BlogPostPage (app/(blog)/blog/[slug]/page.tsx:50:7)

## Code Frame
  207 |     setQuestionsError(null);
  208 |     loadAdditionalQuestions();
> 209 |   }, [loadAdditionalQuestions]);
      |       ^
  210 |
  211 |   // Helper function to determine if error should have retry option
  212 |   const getErrorRetryProps = (cacheKey: string) => {

Next.js version: 15.5.4 (Webpack)
continue