"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";
import { serverurl } from "../utils/constants/serverurl";
import useSuperAdminGuard from "../hooks/useSuperAdminGuard";

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch (_error) {
    return "";
  }
};

const SuperAdminQna = () => {
  const { isSuperAdmin, isCheckingAuth } = useSuperAdminGuard();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [draftAnswers, setDraftAnswers] = useState({});
  const [submittingId, setSubmittingId] = useState("");

  const fetchQuestions = async () => {
    setMessage("");
    setLoading(true);
    try {
      const { data } = await axios.get(`${serverurl}/engagement/admin/questions`, {
        params: { status: filter, q: query || undefined },
        withCredentials: true,
      });
      if (data?.success) {
        const list = Array.isArray(data.questions) ? data.questions : [];
        setQuestions(list);
      } else {
        setMessage("Could not load product questions.");
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || "Could not load product questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, isSuperAdmin]);

  const stats = useMemo(() => {
    let answered = 0;
    let unanswered = 0;
    questions.forEach((entry) => {
      if (entry?.isanswered) answered += 1;
      else unanswered += 1;
    });
    return { answered, unanswered, total: questions.length };
  }, [questions]);

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-white px-4 py-10 text-sm text-[#1f5c49]">Checking SuperAdmin session...</div>;
  }

  if (!isSuperAdmin) return null;

  const handleSubmitAnswer = async (questionId) => {
    const answertext = String(draftAnswers[questionId] || "").trim();
    if (!answertext) {
      setMessage("Please write an answer before submitting.");
      return;
    }

    setMessage("");
    setSubmittingId(questionId);
    try {
      const { data } = await axios.patch(
        `${serverurl}/engagement/admin/questions/${questionId}/answer`,
        { answertext },
        { withCredentials: true }
      );

      if (data?.success && data?.question) {
        setQuestions((prev) => prev.map((entry) => (entry._id === questionId ? data.question : entry)));
        setDraftAnswers((prev) => ({ ...prev, [questionId]: "" }));
      } else {
        setMessage("Could not submit answer.");
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || "Could not submit answer.");
    } finally {
      setSubmittingId("");
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0f2f24]">
      <SuperAdminNav />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-700">KhanCosmetics SuperAdmin</p>
          <h1 className="mt-2 text-3xl font-semibold text-emerald-900">Product Q&A Control Center</h1>
          <p className="mt-2 text-sm text-[#4f6f63]">Answer customer product questions with fast and accurate responses.</p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Total Questions</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Answered</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-900">{stats.answered}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Unanswered</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-900">{stats.unanswered}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by question, customer name, or email"
            className="h-11 flex-1 rounded-xl border border-emerald-200 px-3 outline-none focus:border-emerald-500"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-11 rounded-xl border border-emerald-200 px-3 outline-none focus:border-emerald-500"
          >
            <option value="all">All Questions</option>
            <option value="unanswered">Unanswered</option>
            <option value="answered">Answered</option>
          </select>
          <button
            type="button"
            onClick={fetchQuestions}
            className="h-11 rounded-xl bg-emerald-700 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-emerald-800"
          >
            Search
          </button>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 text-sm uppercase tracking-[0.2em] text-emerald-700">Loading product questions...</div>
        ) : questions.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-white p-8 text-center text-sm text-[#4f6f63]">
            No questions found for this filter.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {questions.map((entry) => (
              <article key={entry._id} className="rounded-2xl border border-emerald-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Product</p>
                    <h2 className="text-lg font-semibold text-emerald-900">{entry?.productid?.name || "Deleted Product"}</h2>
                    <p className="mt-1 text-xs text-[#4f6f63]">
                      By {entry?.askedbyname || "KhanCosmetics User"} | {entry?.askedbyemail || "No email"} |{" "}
                      {formatDate(entry.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                      entry?.isanswered
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {entry?.isanswered ? "Answered" : "Awaiting Reply"}
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-sm leading-6 text-emerald-900">
                  {entry.question}
                </div>

                {entry?.isanswered ? (
                  <div className="mt-4 rounded-xl border border-emerald-100 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-emerald-700">Current Answer</p>
                    <p className="mt-2 text-sm text-[#4f6f63]">{entry.answertext}</p>
                    <p className="mt-2 text-xs text-[#4f6f63]">
                      {entry?.answeredbyname || "SuperAdmin"} | {formatDate(entry?.answeredat)}
                    </p>
                  </div>
                ) : null}

                <div className="mt-4">
                  <textarea
                    rows={4}
                    value={draftAnswers[entry._id] || ""}
                    onChange={(e) => setDraftAnswers((prev) => ({ ...prev, [entry._id]: e.target.value }))}
                    placeholder={entry?.isanswered ? "Update answer (optional)" : "Write official answer from KhanCosmetics..."}
                    className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={submittingId === entry._id}
                    onClick={() => handleSubmitAnswer(entry._id)}
                    className="mt-3 rounded-xl bg-emerald-700 px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submittingId === entry._id ? "Submitting..." : entry?.isanswered ? "Update Answer" : "Submit Answer"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminQna;
