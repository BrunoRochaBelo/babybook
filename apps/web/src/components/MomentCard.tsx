import type { Moment as ApiMoment } from "@babybook/contracts";
import React from "react";
import { useNavigate } from "react-router-dom";

interface MomentCardProps {
  moment: ApiMoment;
}

const extractCoverImage = (
  media: Array<{ kind?: string | null; url?: string | null }> | undefined,
) => {
  if (!media || media.length === 0) {
    return undefined;
  }
  const photo = media.find((item) => item.kind === "photo");
  return photo?.url ?? media[0]?.url;
};

export const MomentCard = ({ moment }: MomentCardProps) => {
  const navigate = useNavigate();
  const coverImage = extractCoverImage(moment.media);
  const displayDate = moment.occurredAt ?? moment.createdAt;

  return (
    <div
      className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105"
      onClick={() => navigate(`/jornada/moment/${moment.id}`)}
    >
      <div className="flex">
        {coverImage ? (
          <img src={coverImage} alt={moment.title} className="w-1/3 object-cover" />
        ) : (
          <div className="w-1/3 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Sem mídia
          </div>
        )}
        <div className="p-4 flex flex-col justify-center">
          <h4 className="font-bold text-lg text-gray-800">{moment.title}</h4>
          {displayDate && (
            <p className="text-sm text-gray-500">
              {new Date(displayDate).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
