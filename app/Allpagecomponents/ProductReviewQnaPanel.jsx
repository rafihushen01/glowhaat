"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Star, UploadCloud, BadgeCheck, MessageCircleQuestion, Send } from "lucide-react";
import { useSelector } from "react-redux";
import { serverurl } from "../utils/constants/serverurl";

const MAX_IMAGE_SLOTS = 8;

const normalizeUser = (userData) => userData?.user || userData?.data || userData || null;

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch (_error) {
    return "";
  }
};

const Stars = ({ value = 0, size = 16 }) => {
  const rounded = Math.max(0, Math.min(5, Number(value || 0)));
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(rounded);
        return <Star key={index} size={size} className={filled ? "fill-emerald-600 text-emerald-600" : "text-emerald-200"} />;
      })}
    </div>
  );
};

const ProductReviewQnaPanel = ({ product }) => {
  const { userData } = useSelector((state) => state.user);
  const user = normalizeUser(userData);

  const [tab, setTab] = useState("reviews");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [qnaStatus, setQnaStatus] = useState("");

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [usePlatformEmail, setUsePlatformEmail] = useState(true);
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [imageSlots, setImageSlots] = useState(3);
  const [selectedImages, setSelectedImages] = useState(Array(MAX_IMAGE_SLOTS).fill(null));
  const [submittingReview, setSubmittingReview] = useState(false);

  const [question, setQuestion] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);

  const loadSummary = async ({ soft = false } = {}) => {
    if (!product?._id) return;
    setError("");
    if (soft) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await axios.get(`${serverurl}/engagement/product/${product._id}/summary`, {
        withCredentials: true,
      });
      if (data?.success) {
        setSummary(data.summary);
      } else {
        setError("Could not load reviews and Q&A.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load reviews and Q&A.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  const viewer = summary?.viewer || {};
  const reviewList = Array.isArray(summary?.reviews) ? summary.reviews : [];
  const questionList = Array.isArray(summary?.questions) ? summary.questions : [];
  const productMeta = summary?.product || {};
  const ratingBreakdown = productMeta?.ratingbreakdown || {};

  const usedImageFiles = useMemo(
    () => selectedImages.filter((file, index) => index < imageSlots && file),
    [selectedImages, imageSlots]
  );

  const handleImageSlotChange = (slotIndex, file) => {
    setSelectedImages((prev) => {
      const next = [...prev];
      next[slotIndex] = file || null;
      return next;
    });
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewStatus("");

    if (!viewer?.isloggedin) {
      setReviewStatus("Please sign in first to submit a review.");
      return;
    }

    if (!viewer?.canreview) {
      setReviewStatus(viewer?.revieweligibilityreason || "You are not eligible to review this product.");
      return;
    }

    if (!comment.trim()) {
      setReviewStatus("Please write your review comment.");
      return;
    }

    if (usedImageFiles.length > MAX_IMAGE_SLOTS) {
      setReviewStatus(`Maximum ${MAX_IMAGE_SLOTS} images are allowed.`);
      return;
    }

    try {
      setSubmittingReview(true);
      const formData = new FormData();
      formData.append("rating", String(rating));
      formData.append("comment", comment.trim());
      formData.append("reviewername", reviewerName.trim());
      formData.append("useplatformemail", String(usePlatformEmail));
      if (!usePlatformEmail && reviewerEmail.trim()) {
        formData.append("revieweremail", reviewerEmail.trim());
      }
      usedImageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const { data } = await axios.post(`${serverurl}/engagement/product/${product._id}/reviews`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data?.success) {
        setReviewStatus("Your verified review has been published.");
        setComment("");
        setReviewerName("");
        setReviewerEmail("");
        setSelectedImages(Array(MAX_IMAGE_SLOTS).fill(null));
        await loadSummary({ soft: true });
      } else {
        setReviewStatus("Could not submit review.");
      }
    } catch (err) {
      setReviewStatus(err?.response?.data?.message || "Could not submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitQuestion = async (event) => {
    event.preventDefault();
    setQnaStatus("");

    if (!viewer?.isloggedin) {
      setQnaStatus("Please sign in first to ask a question.");
      return;
    }

    if (!question.trim() || question.trim().length < 6) {
      setQnaStatus("Please write at least 6 characters.");
      return;
    }

    try {
      setAskingQuestion(true);
      const { data } = await axios.post(
        `${serverurl}/engagement/product/${product._id}/questions`,
        { question: question.trim() },
        { withCredentials: true }
      );

      if (data?.success) {
        setQnaStatus("Question submitted. SuperAdmin will answer soon.");
        setQuestion("");
        await loadSummary({ soft: true });
      } else {
        setQnaStatus("Could not submit your question.");
      }
    } catch (err) {
      setQnaStatus(err?.response?.data?.message || "Could not submit your question.");
    } finally {
      setAskingQuestion(false);
    }
  };

  return (
    <section className="mt-16 border-t border-emerald-100 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-700">Verified Community</p>
          <h2 className="mt-1 text-3xl font-semibold text-emerald-950">Reviews & Product Q&A</h2>
          <p className="mt-2 text-sm text-emerald-900/70">
            Only delivered customers can review. Every review is verified purchase only.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadSummary({ soft: true })}
          className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 hover:bg-emerald-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Average Rating</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-4xl font-bold text-emerald-900">{Number(productMeta?.averagerating || 0).toFixed(2)}</span>
            <div>
              <Stars value={productMeta?.averagerating || 0} />
              <p className="mt-1 text-xs text-emerald-700/80">{productMeta?.totalreviews || 0} verified reviews</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white p-5 md:col-span-2">
          <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Rating Breakdown</p>
          <div className="mt-3 grid gap-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = Number(ratingBreakdown?.[star] || 0);
              const total = Number(productMeta?.totalreviews || 0);
              const percent = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={star} className="grid grid-cols-[40px_1fr_38px] items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-800">{star} Star</span>
                  <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="text-xs text-emerald-800">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("reviews")}
          className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
            tab === "reviews" ? "bg-emerald-700 text-white" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          Reviews ({productMeta?.totalreviews || 0})
        </button>
        <button
          type="button"
          onClick={() => setTab("qna")}
          className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
            tab === "qna" ? "bg-emerald-700 text-white" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          Q&A ({questionList.length})
        </button>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {loading ? <div className="mt-6 text-sm uppercase tracking-[0.2em] text-emerald-700">Loading reviews and Q&A...</div> : null}

      {!loading && tab === "reviews" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4">
            {reviewList.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-white p-5 text-sm text-emerald-700">
                No verified reviews yet. Be the first delivered buyer to share your experience.
              </div>
            ) : (
              reviewList.map((review) => (
                <article key={review._id} className="rounded-2xl border border-emerald-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-950">{review.reviewername || "Verified Buyer"}</h3>
                      <p className="mt-1 text-xs text-emerald-700/70">{formatDate(review.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <Stars value={review.rating} />
                      {review.isverifiedpurchase ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                          <BadgeCheck size={12} />
                          Verified Purchase
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-emerald-900/85">{review.comment}</p>
                  {Array.isArray(review.images) && review.images.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                      {review.images.map((image, index) => (
                        <img
                          key={`${review._id}-${index}`}
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="h-24 w-full rounded-lg border border-emerald-100 object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
            <h3 className="text-xl font-semibold text-emerald-950">Write Verified Review</h3>
            <p className="mt-2 text-sm text-emerald-800/75">{viewer?.revieweligibilityreason || "Please sign in to write a review."}</p>
            <form onSubmit={submitReview} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Your Rating</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        rating === star
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      <Star size={12} className={rating === star ? "fill-white" : ""} />
                      {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Review Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  placeholder="Share your honest experience with this product..."
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-950 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Display Name</label>
                  <input
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder={user?.fullname || "Your name"}
                    className="h-10 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Email Option</label>
                  <select
                    value={usePlatformEmail ? "platform" : "custom"}
                    onChange={(e) => setUsePlatformEmail(e.target.value === "platform")}
                    className="h-10 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="platform">Use Platform Email</option>
                    <option value="custom">Use Custom Gmail</option>
                  </select>
                </div>
              </div>

              {!usePlatformEmail ? (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Custom Gmail</label>
                  <input
                    type="email"
                    value={reviewerEmail}
                    onChange={(e) => setReviewerEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="h-10 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Image Slots (Max 8)</label>
                <select
                  value={imageSlots}
                  onChange={(e) => setImageSlots(Math.max(1, Math.min(MAX_IMAGE_SLOTS, Number(e.target.value) || 1)))}
                  className="h-10 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  {Array.from({ length: MAX_IMAGE_SLOTS }, (_, idx) => idx + 1).map((slot) => (
                    <option key={slot} value={slot}>
                      {slot} image slot{slot > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {Array.from({ length: imageSlots }, (_, idx) => idx).map((slotIndex) => (
                    <label
                      key={slotIndex}
                      className="flex items-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-white px-3 py-2 text-xs text-emerald-700"
                    >
                      <UploadCloud size={14} />
                      <span className="flex-1 truncate">{selectedImages[slotIndex]?.name || `Upload image ${slotIndex + 1}`}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-[110px] text-[11px]"
                        onChange={(e) => handleImageSlotChange(slotIndex, e.target.files?.[0] || null)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-700 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submittingReview ? "Submitting..." : "Submit Verified Review"}
              </button>
              {reviewStatus ? <p className="text-sm text-emerald-800">{reviewStatus}</p> : null}
            </form>
          </div>
        </div>
      ) : null}

      {!loading && tab === "qna" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4">
            {questionList.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-white p-5 text-sm text-emerald-700">
                No questions yet for this product.
              </div>
            ) : (
              questionList.map((entry) => (
                <article key={entry._id} className="rounded-2xl border border-emerald-200 bg-white p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-700">
                      <MessageCircleQuestion size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-950">{entry.question}</p>
                      <p className="mt-1 text-xs text-emerald-700/70">
                        {entry.askedbyname || "KhanCosmetics User"} | {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                  {entry.isanswered ? (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">KhanCosmetics Reply</p>
                      <p className="mt-2 text-sm text-emerald-900/85">{entry.answertext}</p>
                      <p className="mt-2 text-xs text-emerald-700/70">
                        {entry.answeredbyname || "SuperAdmin"} | {formatDate(entry.answeredat)}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                      Waiting for SuperAdmin response.
                    </div>
                  )}
                </article>
              ))
            )}
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
            <h3 className="text-xl font-semibold text-emerald-950">Ask a Question</h3>
            <p className="mt-2 text-sm text-emerald-800/75">Only logged-in users can ask product questions.</p>
            <form onSubmit={submitQuestion} className="mt-5 space-y-4">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={5}
                placeholder="Ask anything about shade, usage, skin type, delivery, or authenticity..."
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-950 outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={askingQuestion}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send size={14} />
                {askingQuestion ? "Submitting..." : "Submit Question"}
              </button>
              {qnaStatus ? <p className="text-sm text-emerald-800">{qnaStatus}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default ProductReviewQnaPanel;

