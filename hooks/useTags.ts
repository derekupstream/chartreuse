import { useState, useEffect } from 'react';
import { fetchTags, addTag } from 'lib/api';
import { ProjectTag } from '@prisma/client';

export const useTags = (orgId: string) => {
  const [tags, setTags] = useState<ProjectTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    setLoading(true);
    fetchTags(orgId)
      .then(data => {
        setTags(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [orgId]);

  const createTag = async (label: string) => {
    try {
      const newTag = await addTag(orgId, label);
      setTags([...tags, newTag]);
      return newTag;
    } catch (err) {
      setError(err as Error);
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      await fetch('/api/tags', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tagId })
      });
      setTags(tags.filter(tag => tag.id !== tagId));
    } catch (err) {
      setError(err as Error);
    }
  };

  return { tags, loading, error, createTag, deleteTag };
};
