import { useQuery } from "@tanstack/react-query";
import { Post } from "./PostList";
import { supabase } from "../supabase-client";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { Link } from "react-router";

interface Props{
    postId: number;
}

const fetchPostById = async (postId: number): Promise<Post> => {
  const { data, error } = await supabase
      .rpc("get_post_details", { post_id: postId });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Post not found");

  console.log("Post in details: ", data[0]);

  return data[0] as Post;
};

export const PostDetail = ({postId}: Props) => {
    const {data, error, isLoading} = useQuery<Post, Error>({
        queryKey: ["post", postId], 
        queryFn: () => fetchPostById(postId)
    } );


    if(isLoading) return <div>Loading posts...</div>

    if(error){
        return <div>Error: {error.message}</div>
    }


  return (
    <div className="space-y-6">
      <h2 className="text-6xl font-bold mb-6 text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        {data?.title}
      </h2>
      {data?.image_url && (
        <img
          src={data.image_url}
          alt={data?.title}
          className="mt-4 rounded object-cover w-full h-64"
        />
      )}
      <p className="text-gray-400">{data?.content}</p>
      <p className="text-gray-500 text-sm">
        Posted on: {new Date(data!.created_at).toLocaleDateString()}
      </p>

      <div className="flex items-center space-x-2">
        <LikeButton postId = {postId} />

        {data?.avatar_url ? (
          <img
            src={data?.avatar_url}
            alt="User Avatar"
            className="w-[35px] h-[35px] rounded-full object-cover"
          />
        ) : (
          <div className="w-[35px] h-[35px] rounded-full bg-gradient-to-tl from-[#8A2BE2] to-[#491F70]" />
        )}
        <div className="flex flex-col flex-1">
          <div className="text-[20px] leading-[22px] mt-2 text-6xl font-bold  bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            {data?.author_name}
          </div>
        </div>
      </div>
       


      
      {data?.community_id ? (
          <div className="max-w-5xl mx-auto space-y-4">
            <div key={data?.community_id} className="border border-white/10 p-4 rounded hover:-translate-y-1 transition transform">
              <Link to={`/community/${data?.community_id}`} className="hover:underline">
                <span className="text-2xl font-bold text-purple-500">{data?.community_name}</span> <span className="text-xl text-gray-400"> .community</span>
              </Link>
              <p className="text-gray-400 mt-2">More posts from this community</p>
            </div>
        </div>
        ) : (
          <div></div>
        )}

      

      <CommentSection postId={postId} />
    </div>
  );
};