DO $$
DECLARE
  milestones int[] := ARRAY[1,5,10,20,50,100,150,200,250];
  ship_milestones int[] := ARRAY[1,5,10,20];
  m int;
  sub text;
  subs text[] := ARRAY['projects','code','infographs','training','expertise','testimonials','tools','guidebooks','failures'];
  sub_label text;
  sub_icon text;
  sub_color text;
  ord int := 0;
BEGIN
  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,sort_order,evidence_hint)
  VALUES ('signin_welcome','signin','Welcome Aboard','Joined the GoodVibesCafe collective.','UserPlus','primary',ord,'Confirm your sign-up date.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,sort_order,evidence_hint,requires_founder)
  VALUES ('founder','founder','GoodVibesCafe Founder','Co-founder of GoodVibesCafe.','Crown','vibetor',ord,'Founders only.',true);

  FOREACH m IN ARRAY milestones LOOP
    ord := ord + 1;
    INSERT INTO public.badge_catalog(code,category,tier,name,description,icon,color,sort_order,evidence_hint)
    VALUES ('event_attendance_'||m,'event_attendance',m,'Event Attendee, '||m,'Attended '||m||' GoodVibesCafe event'||CASE WHEN m=1 THEN '' ELSE 's' END||'.','CalendarCheck','primary',ord,'List event names and dates you attended.');
  END LOOP;

  FOREACH sub IN ARRAY subs LOOP
    sub_label := CASE sub
      WHEN 'projects' THEN 'Projects & Builds'
      WHEN 'code' THEN 'Codebase & Prompts'
      WHEN 'infographs' THEN 'Infographs'
      WHEN 'training' THEN 'Training Materials'
      WHEN 'expertise' THEN 'Expertise'
      WHEN 'testimonials' THEN 'Testimonials'
      WHEN 'tools' THEN 'Tools'
      WHEN 'guidebooks' THEN 'Guidebooks'
      WHEN 'failures' THEN 'Spectacular Failures'
    END;
    sub_icon := CASE sub
      WHEN 'failures' THEN 'Gem'
      WHEN 'code' THEN 'Code'
      WHEN 'infographs' THEN 'BarChart3'
      WHEN 'tools' THEN 'Wrench'
      WHEN 'guidebooks' THEN 'BookOpen'
      WHEN 'training' THEN 'GraduationCap'
      WHEN 'testimonials' THEN 'MessageSquareQuote'
      WHEN 'expertise' THEN 'Brain'
      ELSE 'Rocket'
    END;
    sub_color := CASE WHEN sub='failures' THEN 'turquoise' ELSE 'primary' END;
    FOREACH m IN ARRAY milestones LOOP
      ord := ord + 1;
      INSERT INTO public.badge_catalog(code,category,subcategory,tier,name,description,icon,color,is_diamond,bonus_points,sort_order,evidence_hint)
      VALUES (
        'content_'||sub||'_'||m,
        'content', sub, m,
        sub_label||', '||m,
        'Shared '||m||' '||lower(sub_label)||' with the collective.',
        sub_icon, sub_color,
        sub = 'failures',
        CASE WHEN sub='failures' THEN 1 ELSE 0 END,
        ord,
        'Link to the showcase items or content shared.'
      );
    END LOOP;
  END LOOP;

  FOR m IN 1..10 LOOP
    ord := ord + 1;
    INSERT INTO public.badge_catalog(code,category,tier,name,description,icon,color,sort_order,evidence_hint)
    VALUES ('subscription_year_'||m,'subscription_years',m,m||'-Year Member','Completed '||m||' year'||CASE WHEN m=1 THEN '' ELSE 's' END||' of paid membership.','Calendar','primary',ord,'Membership start date.');
  END LOOP;

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,sort_order,evidence_hint)
  VALUES ('serendipity','serendipity','Lucky Strike','Acknowledges that serendipity matters as much as grinding.','Sparkles','primary',ord,'Tell the story of the lucky moment.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,requires_peer,sort_order,evidence_hint)
  VALUES ('intro_member','intro','Connector','Introduced another member, investor, or customer.','Handshake','primary',true,ord,'Name the person introduced; they will confirm.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,requires_peer,sort_order,evidence_hint)
  VALUES ('invite_member','invite','Recruiter','Invited a member who joined the collective.','UserPlus','primary',true,ord,'Name the invited member; they will confirm.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,bonus_points,sort_order,evidence_hint)
  VALUES ('booster','booster','Booster','Brings positive spirit and lifts others up.','Rocket','primary',2,ord,'Examples of how you boost the collective.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,sort_order,evidence_hint)
  VALUES ('time_invest','time_invest','Time Giver','Invested significant time for the collective.','Clock','primary',ord,'Hours and activities contributed.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,bonus_points,sort_order,evidence_hint)
  VALUES ('sponsoring','sponsoring','Sponsor','Sponsored events or activities.','Gift','vibetor',2,ord,'Event or activity sponsored.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,sort_order,evidence_hint)
  VALUES ('speaker','speaker','Speaker','Spoke at an event, training, or workshop.','Mic','primary',ord,'Event name and date.');

  FOREACH m IN ARRAY ship_milestones LOOP
    ord := ord + 1;
    INSERT INTO public.badge_catalog(code,category,tier,name,description,icon,color,sort_order,evidence_hint)
    VALUES ('shipped_'||m,'shipped',m,'Shipped, '||m,'Shipped '||m||' product'||CASE WHEN m=1 THEN '' ELSE 's' END||'.','Ship','primary',ord,'List shipped products with links.');
  END LOOP;

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,requires_peer,sort_order,evidence_hint)
  VALUES ('beta_tester','beta','Beta Tester','Tested another member''s product in beta.','FlaskConical','primary',true,ord,'Name the product owner; they will confirm.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,requires_peer,sort_order,evidence_hint)
  VALUES ('tutoring','tutoring','Tutor','Tutored another member.','BookOpen','primary',true,ord,'Name the tutee; they will confirm.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,requires_peer,sort_order,evidence_hint)
  VALUES ('mentoring','mentoring','Mentor','Mentored another member.','Users','primary',true,ord,'Name the mentee; they will confirm.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,bonus_points,sort_order,evidence_hint)
  VALUES ('publicity','publicity','Amplifier','Generated publicity and mentioned GoodVibesCafe.','Megaphone','primary',2,ord,'Link to article, post, podcast, or media.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,sort_order,evidence_hint)
  VALUES ('physical_product','physical_product','Maker','Built a physical product.','Package','primary',ord,'Describe and link your physical product.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,sort_order,evidence_hint)
  VALUES ('futurist','futurist','Futurist Innovator','Innovating ahead of the curve.','Telescope','primary',ord,'Describe your future-facing innovation.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,bonus_points,sort_order,evidence_hint)
  VALUES ('launch_bizvibe','launch','GoodVibesCafe Launch','Launched a product with GoodVibesCafe.','Rocket','vibetor',2,ord,'Launch name, date, and link.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,sort_order,evidence_hint)
  VALUES ('ambassador','ambassador','GoodVibesCafe Ambassador','Recognised ambassador of GoodVibesCafe.','Star','vibetor',ord,'How you represent GoodVibesCafe; founders validate.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,bonus_points,sort_order,evidence_hint)
  VALUES ('partner','partner','Partner','Official GoodVibesCafe partner (person or company).','Handshake','vibetor',2,ord,'Partnership scope and start date.');

  ord := ord + 1;
  INSERT INTO public.badge_catalog(code,category,name,description,icon,color,sort_order,evidence_hint)
  VALUES ('news_sharing','news','News Curator','Shared news to the platform.','Newspaper','primary',ord,'Links to news shared.');
END $$;