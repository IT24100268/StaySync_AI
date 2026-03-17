import { useState, useEffect } from "react";
import { Star, MessageSquare } from "lucide-react";
import axios from "axios";
import { cardCls, cardStyle, EmptyState, Skeleton, Avatar, PageHeader } from "./ownerTheme.jsx";

const getAuthHeader = () => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= rating ? "text-[#c9a84c]" : "text-[#d8d2c7]"}
          fill={i <= rating ? "currentColor" : "none"}
        />
      ))}
      <span className="ml-1.5 text-[11px] font-bold text-[#b98b1f]">{rating}.0</span>
    </div>
  );
}

export default function OwnerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/reviews/rooms/", {
        headers: getAuthHeader(),
      });
      setReviews(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton h="h-24" rounded="rounded-[22px]" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} h="h-36" rounded="rounded-[22px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquare}
        title="Room Reviews"
        subtitle={`${reviews.length} review${reviews.length !== 1 ? "s" : ""} from students`}
        action={
          reviews.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 rounded-[14px] border border-[#eadab1] bg-[#fff8e8] px-4 py-2">
              <Star size={14} className="text-[#c9a84c]" fill="currentColor" />
              <span className="text-[13px] font-extrabold text-[#b98b1f]">
                {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
              </span>
              <span className="text-[11px] text-[#6f6a5f]">avg rating</span>
            </div>
          )
        }
      />

      {reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" subtitle="Student reviews will appear here once submitted." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className={cardCls("p-5 transition-all hover:-translate-y-0.5")} style={cardStyle()}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={r.user_name || "U"} />
                  <div>
                    <p className="text-[13px] font-extrabold text-[#2b2823]">{r.user_name}</p>
                    <Stars rating={r.rating} />
                  </div>
                </div>

                <span className="flex-shrink-0 rounded-[8px] border border-[#eadfc7] bg-[#fffaf2] px-2.5 py-1 text-[10px] font-semibold text-[#7f786b]">
                  {new Date(r.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="rounded-[12px] border border-[#eee5d7] bg-[#fcfaf6] px-4 py-3">
                <p className="text-[12px] leading-relaxed text-[#6f6a5f]">{r.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}