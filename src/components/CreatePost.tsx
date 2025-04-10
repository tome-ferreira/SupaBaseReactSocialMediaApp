import { ChangeEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../contexts/AuthContext";
import { Community, fetchCommunities } from "./CommunitiesList";
import { useNavigate } from "react-router";

interface PostInput{
    title: string;
    content: string;
    avatar_url: string | null;
    author_name: string;
    author_uid: string;
    community_id?: number | null;
}

const createPost = async (post: PostInput, imageFile: File) => {
    const filePath = `${post.title}-${Date.now()}-${imageFile.name}`;

    const {error: uploadError} = await supabase.storage.from("post-images").upload(filePath, imageFile);


    if(uploadError) throw new Error(uploadError.message);

    console.log(post);

    const {data: publicUrlData} = supabase.storage.from("post-images").getPublicUrl(filePath);

    const {data, error} = await supabase.from("posts").insert({...post, image_url: publicUrlData.publicUrl});

    if(error) throw new Error(error.message);

    return data;
};

export const CreatePost = () => {
    const [title, setTitle] = useState<string>("");
    const [content, setContent] = useState<string>("");
    const [communityId, setCommunityId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const navigate = useNavigate();

    const {user} = useAuth();

    const {data: communities} = useQuery<Community[], Error>({
        queryKey: ["communities"], 
        queryFn: fetchCommunities
    })

    const {mutate, isPending, isError} = useMutation({
        mutationFn: (data: {post: PostInput, imageFile: File}) => { return createPost(data.post, data.imageFile)},
        onSuccess: () => {
            navigate("/");
        },
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()

        if(!user){
            return;
        }

        if(!selectedFile) return;
        mutate({
            post: {
                title, 
                content, 
                avatar_url: user?.user_metadata.avatar_url || null,
                author_name: user?.user_metadata.full_name,
                author_uid: user.id,
                community_id: communityId
            }, 
            imageFile: selectedFile})
    }
    

    const handleCommunityChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setCommunityId(value ? Number(value) : null);
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]){
            setSelectedFile(e.target.files[0]);
        }
    }

    return(
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
            <div>
                <label htmlFor="title" className="block mb-2 font-medium">
                Title
                </label>
                <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-white/10 bg-transparent p-2 rounded"
                required
                />
            </div>
            <div>
                <label htmlFor="content" className="block mb-2 font-medium">
                Content
                </label>
                <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-white/10 bg-transparent p-2 rounded"
                rows={5}
                required
                />
            </div>

            <div>
                <label>Select Community</label>
                <select id="community" onChange={handleCommunityChange}>
                    <option value={""}> -- Chose a Community --</option>
                    {communities?.map((community, key) => (
                        <option key={key} value={community.id}>
                            {community.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="image" className="block mb-2 font-medium">
                Upload Image
                </label>
                <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-gray-200"
                />
            </div>
            <button
                type="submit"
                className="bg-purple-500 text-white px-4 py-2 rounded cursor-pointer"
            >
                {isPending ? "Creating...": "Create Post"}
            </button>

            {isError && <p className="text-red-500">Error creating post.</p>}
        </form>
    );
}