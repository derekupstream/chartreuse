import { useGetTags, useCreateTag, useDeleteTag } from 'lib/api';

export const useTags = (orgId: string) => {
  const { data: tags = [], isLoading: loading, mutate, error } = useGetTags(orgId);
  const { trigger: createTagMutation } = useCreateTag(orgId);
  const { trigger: deleteTagMutation } = useDeleteTag(orgId);

  const createTag = async (label: string) => {
    const newTag = await createTagMutation({ label });
    if (newTag) {
      mutate();
    }
    return newTag;
  };

  const deleteTag = async (tagId: string) => {
    await deleteTagMutation({ tagId });
    mutate();
  };

  return { tags, loading, error, createTag, deleteTag };
};
